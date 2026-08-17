'use client'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const FAQS = [
  {
    q: 'Is my phone number shared with stores?',
    a: 'No. We use your number only to send you one availability notification per search. Stores receive your query and area, not your contact details. Your number is never passed to a third party. If you choose to call a store directly, that is your decision.'
  },
  {
    q: 'What if nothing is available?',
    a: 'You go on the watchlist for that SKU in your area. For the next 60 days, the moment any verified store in your area confirms it is in stock, you receive one WhatsApp. One message per search - we do not send reminders or follow-ups, and if nothing is ever confirmed you will not hear from us at all.'
  },
  {
    q: 'How much does this cost?',
    a: 'Nothing. FMBC is free for members during launch. Founding Members who register now keep free access to core search features for as long as the free tier exists; there is no time limit on the current tier. As the platform grows, Founding Members also unlock wishlist access and community reviews.'
  },
  {
    q: 'How long does a reply take?',
    a: 'We aim to reply within the hour. Response time depends on store availability and time of day. Searches placed late evening may be answered the following morning when stores open.'
  },
  {
    q: 'What does "verified store" mean?',
    a: 'We take reasonable steps to verify that each store holds a valid Punjab excise licence at the time of onboarding, and we run a test query before adding them to the network. Stores that stop responding are removed. Licence status can change after onboarding, so we encourage you to confirm with the store directly before visiting.'
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const reduced = useReducedMotion() ?? false

  return (
    <section className="faq-section">
      <div className="container">
        <h2 className="section-title">Things people ask</h2>

        <div className="faq-list">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} className={`faq-item${isOpen ? ' faq-item--open' : ''}`}>
                <motion.button
                  className="faq-q"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  animate={reduced ? undefined : { rotateX: isOpen ? 2 : 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ transformOrigin: 'top center' }}
                >
                  <span>{item.q}</span>
                  <motion.span
                    className="faq-icon mono"
                    aria-hidden="true"
                    animate={reduced ? undefined : { rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    +
                  </motion.span>
                </motion.button>

                {reduced ? (
                  isOpen && <p className="faq-a">{item.a}</p>
                ) : (
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <motion.p
                          className="faq-a"
                          initial={{ y: -8 }}
                          animate={{ y: 0 }}
                          exit={{ y: -8 }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                        >
                          {item.a}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
