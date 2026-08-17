// In-house Interakt WhatsApp client — no n8n anywhere in this path.
// Next.js calls Interakt's public message API directly for outbound sends,
// and receives Interakt's webhook directly for inbound replies + delivery
// status (see app/api/interakt-webhook/route.ts).
//
// Requires INTERAKT_API_KEY in Vercel env vars (Interakt Dashboard → Developer
// Settings) for sending. Interakt auth is HTTP Basic with the API key as the
// credential — NOT Bearer. This was the exact mismatch that broke the
// original n8n node, so it's called out here deliberately.
//
// Requires INTERAKT_WEBHOOK_SECRET for verifying inbound webhook calls (see
// verifyInteraktSignature below) — a separate credential from INTERAKT_API_KEY,
// both configured in the same Interakt dashboard section. Note: Interakt's
// webhooks (both incoming-message and delivery-status) require a Growth or
// Advanced plan — the Starter plan doesn't expose webhooks at all, so confirm
// the plan before relying on the reply-handling half of this loop.
//
// API references:
// - Sending: https://www.interakt.shop/resource-center/how-to-send-whatsapp-templates-using-apis-webhooks/
// - Webhooks: https://www.interakt.shop/resource-center/interakts-webhooks-for-customer-messages-sent-template-status/

import { createHmac, timingSafeEqual } from 'crypto'

const INTERAKT_API_URL = 'https://api.interakt.ai/v1/public/message/'

export interface InteraktResult {
  success: boolean
  id?: string
  error?: string
}

// phone: bare 10-digit Indian mobile number, no country code, no leading zero.
// templateName: the Interakt/Meta-approved template's code name (e.g. "search_received").
// bodyValues: values for the template's {{1}}, {{2}}, ... body variables, in order.
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  bodyValues: string[]
): Promise<InteraktResult> {
  const apiKey = process.env.INTERAKT_API_KEY
  if (!apiKey) {
    console.error('INTERAKT_API_KEY not configured — cannot send WhatsApp message')
    return { success: false, error: 'not_configured' }
  }

  try {
    const res = await fetch(INTERAKT_API_URL, {
      method: 'POST',
      headers: {
        // Basic auth with the raw API key as the credential — Interakt's own
        // convention, distinct from standard base64(user:pass) Basic auth.
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        countryCode: '+91',
        phoneNumber: phone,
        type: 'Template',
        template: {
          name: templateName,
          languageCode: 'en',
          bodyValues,
        },
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok || !data?.result) {
      console.error('Interakt send failed:', res.status, JSON.stringify(data))
      return { success: false, error: data?.message || `HTTP ${res.status}` }
    }

    return { success: true, id: data.id }
  } catch (e) {
    console.error('Interakt send threw:', e)
    return { success: false, error: 'network_error' }
  }
}

// Verifies Interakt's inbound webhook signature so app/api/interakt-webhook
// can't be spoofed by anyone who discovers the URL. Interakt signs the raw
// request body with HMAC-SHA256 using a pre-shared secret (set the same
// value as INTERAKT_WEBHOOK_SECRET here and in the Interakt dashboard's
// webhook config) and sends it as the `Interakt-Signature` header, formatted
// as "sha256=<hex>".
//
// IMPORTANT: this must be called with the *raw* request body text (before
// JSON.parse), since the signature is computed over the exact bytes sent —
// re-serializing a parsed object can produce a different string and fail
// verification even for a genuine request.
export function verifyInteraktSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.INTERAKT_WEBHOOK_SECRET
  if (!secret) {
    console.error('INTERAKT_WEBHOOK_SECRET not configured — refusing to trust inbound webhook')
    return false
  }
  if (!signatureHeader) return false

  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  const expectedBuf = Buffer.from(expected)
  const receivedBuf = Buffer.from(signatureHeader)
  if (expectedBuf.length !== receivedBuf.length) return false
  return timingSafeEqual(expectedBuf, receivedBuf)
}
