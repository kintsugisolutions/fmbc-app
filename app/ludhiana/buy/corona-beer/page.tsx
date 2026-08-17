import type { Metadata } from 'next'
import { Suspense } from 'react'
import Nav from '@/components/Nav'
import SearchForm from '@/components/SearchForm'

export const metadata: Metadata = {
  title: 'Where to Buy Corona Beer in Ludhiana | Find My Bottle Club',
  description: 'Looking to buy Corona Beer in Ludhiana? Find My Bottle Club checks availability across verified Ludhiana stores and WhatsApps you when confirmed in stock.',
  keywords: 'corona beer ludhiana, imported beer ludhiana, where to buy corona ludhiana',
}

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <div className="seo-page container">
          <div className="seo-hero">
            <p className="seo-city-tag mono">Ludhiana, Punjab</p>
            <h1 className="seo-h1">Where to Buy Corona Beer in Ludhiana</h1>
            <p className="seo-intro">
              Mexico's iconic imported beer. Crisp, light, the one with a lime. Finding it in Ludhiana can be hit or miss.
              Find My Bottle Club checks availability in real time across verified stores
              and WhatsApps you the moment it is confirmed.
            </p>
            <Suspense fallback={null}><SearchForm /></Suspense>
          </div>
          <div className="seo-card">
            <h3>Is Corona Beer available in Ludhiana?</h3>
            <p>Availability varies by store and changes daily. Search once on Find My Bottle Club — we check our verified store network across Model Town, BRS Nagar, Civil Lines, and other Ludhiana areas and send you a WhatsApp when a store confirms it is in stock.</p>
          </div>
          <div className="seo-card">
            <h3>Which areas of Ludhiana should I check?</h3>
            <p>Premium imported spirits and beers are most commonly stocked in stores in Model Town, Civil Lines, BRS Nagar, and Sarabha Nagar. Our network covers all major areas of Ludhiana. Search with your area and we will prioritise stores nearest to you.</p>
          </div>
          <div className="seo-card">
            <h3>What if it is not available right now?</h3>
            <p>If our network cannot confirm Corona Beer right now, you go on the watchlist for it. For the next 60 days, the moment any verified store in your area confirms it is in stock, you receive one WhatsApp. No reminders, no follow-ups, and nothing at all if it is never confirmed.</p>
          </div>
          <div className="seo-cta">
            <h2>Search for Corona Beer now</h2>
            <p>Takes 20 seconds. We check availability across Ludhiana and WhatsApp you when confirmed. No calls, no guessing.</p>
            <a href="/">Search Now</a>
          </div>
        </div>
      </main>
      <footer className="footer">
        <p className="footer-brand mono">Find My Bottle Club · Ludhiana</p>
        <p className="footer-note">
          We do not sell alcohol. We are an availability signal service. This platform is accessible to adults aged 25+ only.<br />
          Brand names on this page are trademarks of their respective owners. Find My Bottle Club is not affiliated with, endorsed by, or partnered with any alcohol brand.
        </p>
        <p className="footer-legal mono">
          <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a>
        </p>
        <p className="footer-version mono">v1.0 · Effective 9 June 2026 · Governed by laws of India · Jurisdiction: Ludhiana, Punjab</p>
      </footer>
    </>
  )
}
