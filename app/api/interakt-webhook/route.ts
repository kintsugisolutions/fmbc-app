import { NextRequest, NextResponse } from 'next/server'
import { verifyInteraktSignature, sendWhatsAppTemplate } from '@/lib/interakt'
import {
  findPendingQueryByVenuePhone,
  recordVenueReply,
  upsertAvailability,
  claimUserSearchConfirmation,
  normalisePhone,
} from '@/lib/search-loop'

// Receives Interakt's inbound webhook — the half of the search/notify loop
// n8n used to own and nothing had replaced yet (2026-08-17). Handles two
// event types:
//   - "message_received": a store replied on WhatsApp to a venue query.
//   - "message_api_failed": an outbound template send failed after the fact
//     (logged only for now — see comment below).
// "message_api_sent" / "_delivered" / "_read" are acknowledged and ignored.
//
// Configure this URL in Interakt: Settings -> Developer Settings -> Webhooks.
// NOTE: Interakt's webhooks (both event families) require a Growth or
// Advanced plan — the Starter plan doesn't expose webhooks at all. Confirm
// the plan covers this before relying on it. Set the same shared secret
// there and in INTERAKT_WEBHOOK_SECRET here — see lib/interakt.ts for the
// exact verification scheme (HMAC-SHA256 over the raw body, per Interakt's
// docs: https://www.interakt.shop/resource-center/interakts-webhooks-for-customer-messages-sent-template-status/).
//
// Interakt requires a 200 response within 3 seconds for every event. This
// handler does its Supabase + outbound-message work synchronously (a handful
// of small queries against a low-volume pilot dataset, well within budget
// today) rather than queueing — there's no background job infra in this
// stack yet. Revisit if/when search volume grows enough that this margin
// gets tight; the fix would be acknowledging immediately and processing via
// a queue (e.g. Vercel's waitUntil, or a real queue if volume justifies it).

const CONFIRM_TEMPLATE_NAME = process.env.INTERAKT_CONFIRM_TEMPLATE_NAME || 'product_confirmed'

export async function POST(req: NextRequest) {
  // Read as raw text FIRST — signature verification needs the exact bytes
  // Interakt signed. Parsing to JSON and re-serializing can change spacing/
  // key order and silently break verification for genuine requests.
  const rawBody = await req.text()
  const signature = req.headers.get('interakt-signature')

  if (!verifyInteraktSignature(rawBody, signature)) {
    console.error('Interakt webhook: signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Once the signature checks out, always acknowledge with 200 — a
  // business-logic miss (can't match a venue, reply text unrecognised, etc.)
  // is not Interakt's fault and shouldn't trigger their retry/health logic.
  try {
    if (payload?.type === 'message_received') {
      await handleIncomingMessage(payload)
    } else if (payload?.type === 'message_api_failed') {
      // Delivery failure on an outbound template send. Logged for visibility
      // in Vercel logs only for now — not yet wired to retry or alerting.
      // Worth revisiting once real send volume exists: a failed "search
      // received" notify to a venue means that venue silently never heard
      // about a search at all.
      console.error('Interakt: outbound message failed:', JSON.stringify(payload?.data))
    }
    // message_api_sent / message_api_delivered / message_api_read: no action
    // needed yet — acknowledged and ignored.
  } catch (e) {
    // Never let a processing error surface as a non-200 to Interakt.
    console.error('Interakt webhook handler threw:', e)
  }

  return NextResponse.json({ ok: true })
}

async function handleIncomingMessage(payload: any) {
  const venuePhone: string | undefined = payload?.data?.customer?.channel_phone_number
  const messageText: string | undefined = payload?.data?.message?.message
  const receivedAt: string | undefined = payload?.data?.message?.received_at_utc

  if (!venuePhone || messageText === undefined) {
    console.warn('Interakt message_received: missing phone or message text', JSON.stringify(payload))
    return
  }

  const context = await findPendingQueryByVenuePhone(venuePhone)
  if (!context) {
    // No open query for this number — could be a store texting outside the
    // loop, a duplicate reply to an already-resolved query, or a wrong
    // number. Log and move on; nothing to update.
    console.warn(`Interakt message_received: no pending query found for ${venuePhone}`)
    return
  }

  const reply = messageText.trim().toLowerCase()
  const repliedAt = receivedAt ? new Date(receivedAt).toISOString() : new Date().toISOString()

  // Deliberately simple keyword matching, not NLP — matches the "1 = Yes,
  // 2 = No" convention the outbound template asks stores to use, plus a
  // couple of obvious plain-English variants. Anything else is logged
  // as-is under 'Replied' for manual review rather than guessed at — a
  // wrong auto-classification here (marking "no" as "yes") is worse than
  // leaving it for a human to check.
  let status: 'Available' | 'Not Available' | 'Replied'
  if (reply === '1' || reply.includes('yes') || reply.includes('available')) {
    status = 'Available'
  } else if (reply === '2' || reply.includes('no')) {
    status = 'Not Available'
  } else {
    status = 'Replied'
  }

  await recordVenueReply({
    venueQueryId: context.venueQueryId,
    status,
    rawReplyText: messageText,
    repliedAt,
  })

  if (status !== 'Available') return

  if (context.productId) {
    await upsertAvailability({ venueId: context.venueId, productId: context.productId })
  }

  // First venue to confirm "Available" wins the notification to the
  // searcher — claimUserSearchConfirmation is a conditional update so
  // concurrent replies from multiple venues can't double-notify the same
  // person.
  const won = await claimUserSearchConfirmation(context.userSearchId)
  if (!won) return

  const bareUserPhone = normalisePhone(context.userPhone)
  if (!bareUserPhone) {
    console.error(`Cannot notify searcher — stored phone didn't normalise: ${context.userPhone}`)
    return
  }

  // Requires a Meta-approved template named CONFIRM_TEMPLATE_NAME (default
  // "product_confirmed") with two body variables: product, venue name. This
  // needs to be created and approved in the Interakt/Meta template flow
  // before this send will actually work — same requirement as the existing
  // "search_received" template used for the outbound venue notify.
  const result = await sendWhatsAppTemplate(bareUserPhone, CONFIRM_TEMPLATE_NAME, [
    context.productName ?? context.rawSearchText,
    context.venueName,
  ])
  if (!result.success) {
    console.error(`Failed to notify searcher for user_search ${context.userSearchId}:`, result.error)
  }
}
