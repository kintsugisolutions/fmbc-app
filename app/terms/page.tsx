import type { Metadata } from 'next'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Terms of Service | Find My Bottle Club',
  description: 'Terms of Service for Find My Bottle Club.',
  robots: 'noindex',
}

// Terms of Service — v1.0 — Effective 9 June 2026
// Governed by: IT Act 2000 | DPDP Act 2023 | BNS 2023
// Jurisdiction: Courts of Ludhiana, Punjab, India

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main>
        <div className="legal-page container">
          <div className="legal-header">
            <p className="legal-eyebrow mono">Legal · Terms</p>
            <h1 className="legal-h1">Terms of Service</h1>
            <p className="legal-meta mono">Version 1.0 · Effective 9 June 2026 · Last reviewed 9 June 2026</p>
          </div>

          <div className="legal-body">
            <p>
              Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using
              Find My Bottle Club (&ldquo;FMBC&rdquo;, &ldquo;the Service&rdquo;). By using FMBC you agree to be
              bound by these Terms.
            </p>

            <h2>1. What FMBC Is</h2>
            <p>
              Find My Bottle Club is an alcohol <strong>availability signal service</strong>.
              We check whether specific alcohol SKUs are available at verified retailers and
              bars in Ludhiana, Punjab, India, and notify you via WhatsApp when availability
              is confirmed. FMBC does not sell alcohol, process payments, facilitate delivery,
              or act as a liquor vendor or retailer in any capacity.
            </p>

            <h2>2. Eligibility</h2>
            <p>
              You must be at least 25 years of age to use FMBC. By using the Service you
              confirm that you are 25 years of age or older and that it is lawful for you
              to access alcohol-related information in your jurisdiction. If you do not meet
              this requirement, you must not use FMBC.
            </p>
            <p>
              FMBC is currently available only to members in Ludhiana, Punjab, India.
            </p>

            <h2>3. How the Service Works</h2>
            <p>
              When you submit a search, you provide a product name, your area in Ludhiana,
              and your WhatsApp number. FMBC forwards this query to verified stores and
              venues in its network. If availability is confirmed, you receive a WhatsApp
              message with the store or venue name, area, and contact information. If no
              availability is confirmed, you may be added to a watchlist and notified when
              the product surfaces.
            </p>

            <h2>4. No Purchase or Fulfillment</h2>
            <p>
              FMBC facilitates discovery only. It does not sell, supply, or deliver alcohol.
              Any purchase you make from a store or venue introduced through FMBC is a
              transaction solely between you and that store or venue. FMBC is not a party
              to that transaction and accepts no liability for it.
            </p>

            <h2>5. Accuracy of Availability Information</h2>
            <p>
              Availability information is based on real-time confirmation from stores and
              venues in our network. We do not guarantee the accuracy, completeness, or
              timeliness of any availability result. Stock levels can change between
              confirmation and your arrival at a store. FMBC is not liable for any
              inconvenience arising from inaccurate or outdated availability information.
            </p>

            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Submit false, misleading, or abusive search requests.</li>
              <li>Attempt to access the Service by automated means, bots, or scrapers.</li>
              <li>Misuse the Service in a way that could harm FMBC, its network, or other users.</li>
              <li>Use the Service if you are below the minimum age of 25 years.</li>
              <li>Use the Service for any purpose that is unlawful under Indian law.</li>
            </ul>

            <h2>7. WhatsApp Communications</h2>
            <p>
              By providing your WhatsApp number, you consent to receiving one availability
              notification per search from FMBC via WhatsApp. FMBC communicates via the
              WhatsApp Business API. You may opt out of future communications by replying
              &ldquo;STOP&rdquo; to any message from FMBC.
            </p>

            <h2>8. Intellectual Property</h2>
            <p>
              All content, branding, and technology associated with FMBC are the property
              of Find My Bottle Club. You may not reproduce, distribute, or create derivative
              works from any FMBC content without our prior written consent.
            </p>

            <h2>9. Disclaimers</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of
              any kind. FMBC does not warrant that the Service will be uninterrupted,
              error-free, or that availability information will be accurate. Product and
              brand names referenced on this platform are trademarks of their respective
              owners. FMBC is not affiliated with, endorsed by, or partnered with any
              alcohol brand mentioned on the platform.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, FMBC shall not be liable
              for any indirect, incidental, special, or consequential damages arising from
              your use of the Service, including but not limited to any reliance on
              availability information provided through the Service.
            </p>

            <h2>11. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. The version number and effective
              date at the top of this page will reflect changes. Continued use of FMBC
              after an update constitutes acceptance of the revised Terms.
            </p>

            <h2>12. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising from or
              relating to these Terms or the Service shall be subject to the exclusive
              jurisdiction of the courts in Ludhiana, Punjab, India.
            </p>

            <h2>13. Contact</h2>
            <p>
              For questions about these Terms, contact: <strong>growlink1313@gmail.com</strong>
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
