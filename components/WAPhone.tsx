'use client'
import { motion, useReducedMotion } from 'framer-motion'
import WhatsAppMark from './WhatsAppMark'

// The WhatsApp preview phone, gently floating on a 6s loop with a faint Y-axis
// rotation so it reads as a 3D object hovering above the page. Hover tips it
// toward the pointer. Static under reduced motion. Markup is unchanged from the
// original server section — only the motion wrapper is new.
export default function WAPhone() {
  const reduced = useReducedMotion() ?? false

  return (
    <div className="wa-phone-wrap">
      <motion.div
        className="wa-phone"
        animate={reduced ? undefined : { y: [0, -10, 0], rotateY: [-2, 2, -2] }}
        transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={reduced ? undefined : { rotateY: 8, rotateX: -4, transition: { type: 'spring', stiffness: 200, damping: 18 } }}
      >
        {/* Chat header */}
        <div className="wa-header">
          <div className="wa-avatar" aria-hidden="true">F</div>
          <div className="wa-header-info">
            <p className="wa-name">Find My Bottle Club</p>
            <p className="wa-status mono">Usually replies within the hour</p>
          </div>
          {/* WhatsApp logo mark */}
          <WhatsAppMark size={20} className="wa-logo" />
        </div>

        {/* Chat body */}
        <div className="wa-body">
          {/* Outgoing search request */}
          <div className="wa-msg wa-msg-out">
            <p className="wa-msg-text">Looking for Glenfiddich 12 in Model Town</p>
            <span className="wa-time mono">4:32 PM
              <svg width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{display:'inline-block',marginLeft:'4px',verticalAlign:'middle'}}>
                <path d="M1 4.5l3 3 5-6" stroke="#53BDEB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 4.5l3 3 5-6" stroke="#53BDEB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          {/* Incoming confirmation */}
          <div className="wa-msg wa-msg-in">
            <p className="wa-msg-text">
              ✅ <strong>Found: Glenfiddich 12 Year</strong><br/>
              📍 Sarabha Nagar Wine Shop<br/>
              📞 +91 98765 XXXXX<br/>
              🕙 Open till 10 PM tonight
            </p>
            <span className="wa-time mono">4:48 PM</span>
          </div>

          {/* Follow-up note */}
          <div className="wa-msg wa-msg-in">
            <p className="wa-msg-text">
              Stock confirmed for today. Availability may change — we recommend calling ahead before visiting.
            </p>
            <span className="wa-time mono">4:48 PM</span>
          </div>

          {/* Typing indicator */}
          <div className="wa-typing" aria-label="FMBC is checking availability">
            <span /><span /><span />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
