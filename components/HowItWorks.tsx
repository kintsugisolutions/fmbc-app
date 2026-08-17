'use client'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

// "How it works" — three steps, staggered into view on a slight 3D tilt, joined
// by gold connector lines that draw themselves in with a glow dot travelling the
// path. Copy and icons are unchanged from the original server markup; this client
// component only adds motion. Connectors are hidden on mobile (single column).

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}
const stepVariant: Variants = {
  hidden: { opacity: 0, y: 24, rotateX: -15 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}
const connectorVariant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

function Connector({ reduced }: { reduced: boolean }) {
  return (
    <motion.div className="step-connector" variants={connectorVariant} aria-hidden="true">
      <svg className="step-connector-svg" viewBox="0 0 72 12" fill="none" preserveAspectRatio="none">
        <motion.line
          x1="2" y1="6" x2="70" y2="6"
          stroke="rgba(210,167,79,0.5)" strokeWidth="1.5" strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={reduced ? undefined : { pathLength: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        {!reduced && (
          <motion.circle
            r="2.4" cy="6" fill="#E8C878"
            style={{ filter: 'drop-shadow(0 0 3px rgba(210,167,79,0.9))' }}
            initial={{ cx: 2 }}
            whileInView={{ cx: [2, 70] }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.3 }}
          />
        )}
      </svg>
    </motion.div>
  )
}

export default function HowItWorks() {
  const reduced = useReducedMotion() ?? false

  return (
    <section className="how-section">
      <div className="container">
        <h2 className="section-title">Three steps. One WhatsApp.</h2>

        <motion.div
          className="steps"
          variants={container}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div className="step" variants={stepVariant}>
            <p className="step-num mono">01</p>
            <div className="step-medallion">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="8.5" stroke="#D2A74F" strokeWidth="1.5"/>
                <path d="M20.5 20.5L27 27" stroke="#D2A74F" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="step-title">You search</h3>
            <p className="step-desc">Tell us what you are looking for and where you are in Ludhiana. Takes 20 seconds.</p>
          </motion.div>

          <Connector reduced={reduced} />

          <motion.div className="step" variants={stepVariant}>
            <p className="step-num mono">02</p>
            <div className="step-medallion">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 5C9.925 5 5 9.477 5 15c0 2.013.618 3.882 1.681 5.438L5 27l6.738-1.663A11.1 11.1 0 0016 27c6.075 0 11-4.477 11-10S22.075 5 16 5z" stroke="#D2A74F" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M11 15h.01M16 15h.01M21 15h.01" stroke="#D2A74F" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="step-title">We check</h3>
            <p className="step-desc">We reach out to our verified store network in Ludhiana and confirm availability in real time.</p>
          </motion.div>

          <Connector reduced={reduced} />

          <motion.div className="step" variants={stepVariant}>
            <p className="step-num mono">03</p>
            <div className="step-medallion">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 5a7 7 0 00-7 7v5l-2 3h18l-2-3v-5a7 7 0 00-7-7z" stroke="#D2A74F" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M13.5 24a2.5 2.5 0 005 0" stroke="#D2A74F" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="16" cy="5" r="1.5" fill="#D2A74F"/>
              </svg>
            </div>
            <h3 className="step-title">You get notified</h3>
            <p className="step-desc">A WhatsApp arrives with the store name, area, and contact. If nothing is confirmed today, we keep watching for 60 days and message you when a store confirms it.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
