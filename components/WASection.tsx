// WhatsApp reply preview — shows users exactly what they receive.
// Pure display component, no client JS needed.

export default function WASection() {
  return (
    <section className="wa-section">
      <div className="container">
        <p className="section-eyebrow mono">What you receive</p>
        <h2 className="section-title">One WhatsApp. All the details.</h2>

        <div className="wa-phone-wrap">
          <div className="wa-phone">
            {/* Chat header */}
            <div className="wa-header">
              <div className="wa-avatar" aria-hidden="true">F</div>
              <div className="wa-header-info">
                <p className="wa-name">Find My Bottle Club</p>
                <p className="wa-status mono">Usually replies within the hour</p>
              </div>
              {/* WhatsApp logo mark */}
              <svg className="wa-logo" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3C7.03 3 3 7.03 3 12c0 1.77.49 3.42 1.34 4.84L3 21l4.3-1.31A9 9 0 1012 3z" fill="#25D366"/>
                <path d="M9.2 7.8c-.2-.5-.7-.5-.9 0l-.6 1.4c-.1.3 0 .6.2.8.5.6 1.1 1.1 1.7 1.6.8.6 1.6 1.1 2.5 1.4.3.1.7 0 .9-.3l.8-1c.2-.3.5-.3.8-.1l1.8 1.1c.3.2.4.5.3.8-.3.9-1.1 1.8-2 1.8-2.5 0-6.2-3.5-6.2-6 0-.9.8-1.7 1.7-2z" fill="white"/>
              </svg>
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
          </div>
        </div>

        <p className="wa-caption mono">Real format · No spam · One message per search · Your number stays private</p>
      </div>
    </section>
  )
}
