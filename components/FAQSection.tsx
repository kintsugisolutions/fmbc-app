'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Is my phone number shared with stores?',
    a: 'No. We use your number only to send you one availability notification per search. Stores receive your query and area — not your contact details. Your number is never passed to a third party. If you choose to call a store directly, that is your decision.'
  },
  {
    q: 'What if nothing is available?',
    a: 'You are automatically added to the watchlist for that SKU. When any store in your area confirms it is in stock, you receive a WhatsApp alert. No need to search again — we track it for you.'
  },
  {
    q: 'How much does this cost?',
    a: 'Nothing. FMBC is free for members during launch. Founding Members who register now keep free access to core search features for as long as the free tier exists — no time limit on the current tier. As the platform grows, Founding Members also unlock wishlist access and community reviews.'
  },
  {
    q: 'How long does a reply take?',
    a: 'We aim to reply within the hour. Response time depends on store availability and time of day. Searches placed late evening may be answered the following morning when stores open.'
  },
  {
    q: 'What does "verified store" mean?',
    a: 'We take reasonable steps to verify that each store holds a valid Punjab excise licence at the time of onboarding, and we run a test query before adding them to the network. Stores that stop responding are removed. Licence status can change after onboarding — we encourage you to confirm with the store directly before visiting.'
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="faq-section">
      <div className="container">
        <p className="section-eyebrow mono">Questions</p>
        <h2 className="section-title">Things people ask</h2>

        <div className="faq-list">
          {FAQS.map((item, i) => (
            <div key={i} className={`faq-item${open === i ? ' faq-item--open' : ''}`}>
              <button
                className="faq-q"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span>{item.q}</span>
                <span className="faq-icon mono" aria-hidden="true">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <p className="faq-a">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
