import type { Metadata } from 'next'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Privacy Policy | Find My Bottle Club',
  description: 'Privacy Policy for Find My Bottle Club — how we collect, use, and protect your data.',
  robots: 'noindex',
}

// Privacy Policy — v1.0 — Effective 9 June 2026
// Governed by: DPDP Act 2023 | IT Act 2000 §43A | IT Rules 2021
// Jurisdiction: Courts of Ludhiana, Punjab, India

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main>
        <div className="legal-page container">
          <div className="legal-header">
            <p className="legal-eyebrow mono">Legal · Privacy</p>
            <h1 className="legal-h1">Privacy Policy</h1>
            <p className="legal-meta mono">Version 1.0 · Effective 9 June 2026 · Last reviewed 9 June 2026</p>
          </div>

          <div className="legal-body">
            <p>
              Find My Bottle Club (&ldquo;FMBC&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is an alcohol availability
              signal service that connects users searching for specific alcohol SKUs with
              verified retailers and bars in Ludhiana, Punjab, India. We do not sell alcohol
              or process payments.
            </p>
            <p>
              This Privacy Policy explains what personal data we collect, why we collect it,
              how we use it, and your rights under the Digital Personal Data Protection Act
              2023 (&ldquo;DPDP Act&rdquo;) and other applicable Indian laws.
            </p>
            <p>
              By using FMBC and providing your WhatsApp number, you consent to the practices
              described in this policy.
            </p>

            <h2>1. Data We Collect</h2>
            <p>
              We collect only the data strictly necessary to provide the service:
            </p>
            <ul>
              <li><strong>WhatsApp number</strong> — provided by you when submitting a search request. Used to send one availability notification per search.</li>
              <li><strong>Search query</strong> — the product name you search for (e.g., &ldquo;Glenfiddich 12&rdquo;). Used to check availability with our store network.</li>
              <li><strong>Area in Ludhiana</strong> — the neighbourhood you select. Used to prioritise stores nearest to you.</li>
              <li><strong>Search type</strong> — whether you want to buy a bottle or drink at a venue. Used to route your query to the right network.</li>
              <li><strong>Timestamp and source</strong> — the time of your search and the platform used (web). Used for internal quality monitoring and fraud prevention.</li>
            </ul>
            <p>We do not collect your name, email address, physical address, payment information, or any government-issued identifier.</p>

            <h2>2. Purpose of Collection</h2>
            <p>Your data is collected for one specific purpose: to check alcohol availability with our verified store and venue network in Ludhiana and to send you a WhatsApp notification with the result. We do not use your data for advertising, marketing, profiling, or any secondary purpose without fresh consent.</p>

            <h2>3. How We Use Your WhatsApp Number</h2>
            <p>
              Your WhatsApp number is forwarded to our automation platform (n8n) to trigger
              availability checks with verified stores. Once a result is confirmed or you are
              added to a watchlist, you receive a single WhatsApp notification. We do not use
              your number for unsolicited marketing messages.
            </p>

            <h2>4. Data Sharing</h2>
            <p>We share your search data with the following third-party processors to deliver the service:</p>
            <ul>
              <li><strong>n8n</strong> — workflow automation platform that routes your query to our store network.</li>
              <li><strong>Interakt / Meta WhatsApp Business API</strong> — used to send you the availability notification on WhatsApp.</li>
              <li><strong>Airtable</strong> — used to store search logs and demand signals for service improvement.</li>
            </ul>
            <p>We do not sell your personal data to any third party.</p>

            <h2>5. Data Retention</h2>
            <p>
              Search logs including your phone number are retained for 90 days from the date of your search, after which they are deleted from our active systems. Aggregated and anonymised demand-signal data (with no personally identifiable information) may be retained indefinitely for service improvement.
            </p>

            <h2>6. Your Rights under the DPDP Act 2023</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request a summary of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure</strong> — request deletion of your personal data from our systems.</li>
              <li><strong>Withdraw consent</strong> — withdraw your consent to processing at any time. Withdrawal does not affect the lawfulness of processing before withdrawal.</li>
              <li><strong>Grievance redressal</strong> — raise a complaint with our Grievance Officer (see Section 8 below).</li>
            </ul>
            <p>To exercise any of these rights, contact us at the address in Section 8.</p>

            <h2>7. Security</h2>
            <p>
              We implement industry-standard technical and organisational measures to protect your
              personal data against unauthorised access, disclosure, alteration, or destruction.
              In the event of a data breach that is likely to cause harm to you, we will notify
              you and the relevant authority within 72 hours of becoming aware of the breach.
            </p>

            <h2>8. Grievance Officer</h2>
            <p>
              In accordance with the Information Technology Act 2000 and IT Rules 2021, the
              following person has been designated as the Grievance Officer for Find My Bottle Club:
            </p>
            <div className="legal-contact">
              <p><strong>Name:</strong> Sehaj (Find My Bottle Club)</p>
              <p><strong>Contact:</strong> growlink1313@gmail.com</p>
              <p><strong>Response time:</strong> We will acknowledge your grievance within 48 hours and resolve it within 30 days.</p>
            </div>

            <h2>9. Age Restriction</h2>
            <p>
              FMBC is an alcohol availability service. Access is restricted to adults aged 25 years
              and above as required under the Punjab Excise Act 1914 and applicable Punjab excise
              rules. We do not knowingly collect personal data from individuals below the age of 25.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The version number and
              effective date at the top of this page will reflect any changes. Continued use of
              FMBC after an update constitutes acceptance of the revised policy.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              This Privacy Policy is governed by the laws of India. Any disputes arising from
              this policy shall be subject to the exclusive jurisdiction of the courts in
              Ludhiana, Punjab, India.
            </p>
          </div>
        </div>
      </main>
      <footer className="footer">
        <p className="footer-brand mono">Find My Bottle Club · Ludhiana</p>
        <p className="footer-note">We do not sell alcohol. We are an availability signal service.</p>
        <p className="footer-legal mono">
          <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a>
        </p>
        <p className="footer-version mono">v1.0 · Effective 9 June 2026 · Governed by laws of India · Jurisdiction: Ludhiana, Punjab</p>
      </footer>
    </>
  )
}
