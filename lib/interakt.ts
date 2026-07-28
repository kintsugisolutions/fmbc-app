// Direct Interakt WhatsApp client — "Plan B" path, used when NOTIFY_MODE=direct.
// Bypasses n8n entirely: Next.js calls Interakt's public message API itself.
//
// Requires INTERAKT_API_KEY in Vercel env vars (Interakt Dashboard → Developer
// Settings). Interakt auth is HTTP Basic with the API key as the credential —
// NOT Bearer. This was the exact mismatch that broke the original n8n node,
// so it's called out here deliberately.
//
// API reference: https://www.interakt.shop/resource-center/how-to-send-whatsapp-templates-using-apis-webhooks/

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
