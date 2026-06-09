import { Suspense } from 'react'
import Image from 'next/image'
import Nav from '@/components/Nav'
import HeroContent from '@/components/HeroContent'
import BrowseSection from '@/components/BrowseSection'
import WASection from '@/components/WASection'
import FAQSection from '@/components/FAQSection'
import StickyBar from '@/components/StickyBar'

const AREAS_PREVIEW = [
  'Model Town','BRS Nagar','Civil Lines','Sarabha Nagar',
  'Dugri','Pakhowal Road','Ferozepur Road','+ 4 more'
]

export default function Home() {
  return (
    <>
      <Nav />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="hero" id="search-anchor">
          <p className="hero-eyebrow mono">Ludhiana · Members Only</p>

          <div className="launch-strip">
            <span className="launch-dot" />
            <span className="launch-text mono">Launching in Ludhiana · New stores added every day</span>
          </div>

          <h1 className="hero-title">
            Find the bottle<br />
            <span>you have been looking for.</span>
          </h1>

          <div className="areas-strip">
            <span className="areas-label mono">Covering</span>
            <div className="areas-pills">
              {AREAS_PREVIEW.map(a => (
                <span key={a} className={`area-pill mono${a.startsWith('+') ? ' area-pill--more' : ''}`}>{a}</span>
              ))}
            </div>
          </div>

          {/* Dynamic: hero-sub + counter + ticker + form — requires client */}
          <Suspense fallback={
            <div style={{maxWidth:'520px',margin:'0 auto',minHeight:'400px'}} />
          }>
            <HeroContent />
          </Suspense>
        </section>

        {/* ── Browse ───────────────────────────────────────────────────── */}
        <Suspense fallback={null}>
          <BrowseSection />
        </Suspense>

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <section className="how-section">
          <div className="container">
            <p className="section-eyebrow mono">How it works</p>
            <h2 className="section-title">Three steps. One WhatsApp.</h2>

            <div className="steps">
              <div className="step">
                <p className="step-num mono">01</p>
                <div className="step-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="8.5" stroke="#D2A74F" strokeWidth="1.5"/>
                    <path d="M20.5 20.5L27 27" stroke="#D2A74F" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="step-title">You search</h3>
                <p className="step-desc">Tell us what you are looking for and where you are in Ludhiana. Takes 20 seconds.</p>
              </div>

              <div className="step">
                <p className="step-num mono">02</p>
                <div className="step-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 5C9.925 5 5 9.477 5 15c0 2.013.618 3.882 1.681 5.438L5 27l6.738-1.663A11.1 11.1 0 0016 27c6.075 0 11-4.477 11-10S22.075 5 16 5z" stroke="#D2A74F" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M11 15h.01M16 15h.01M21 15h.01" stroke="#D2A74F" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="step-title">We check</h3>
                <p className="step-desc">We reach out to our verified store network in Ludhiana and confirm availability in real time.</p>
              </div>

              <div className="step">
                <p className="step-num mono">03</p>
                <div className="step-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 5a7 7 0 00-7 7v5l-2 3h18l-2-3v-5a7 7 0 00-7-7z" stroke="#D2A74F" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M13.5 24a2.5 2.5 0 005 0" stroke="#D2A74F" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="16" cy="5" r="1.5" fill="#D2A74F"/>
                  </svg>
                </div>
                <h3 className="step-title">You get notified</h3>
                <p className="step-desc">A WhatsApp arrives with the store name, area, and contact. If nothing is available, you are on the watchlist.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WhatsApp Preview ─────────────────────────────────────────── */}
        <WASection />

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <FAQSection />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand-block">
            <Image src="/fmbc_icon.png" alt="FMBC" width={24} height={24} className="footer-logo" />
            <span className="footer-brand mono">Find My Bottle Club</span>
          </div>
          <p className="footer-tagline">The city&apos;s bottle search engine.</p>
        </div>
        <p className="footer-note">
          We do not sell alcohol. We are an availability signal service.
          This platform is accessible to adults aged 25+ only.<br />
          Your number is used solely to send availability notifications for your search. No spam. No marketing.
        </p>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <span className="footer-sep">·</span>
          <a href="/terms">Terms of Service</a>
          <span className="footer-sep">·</span>
          <a href="https://www.instagram.com/findmybottleclub" target="_blank" rel="noopener noreferrer" className="footer-insta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
            </svg>
            @findmybottleclub
          </a>
        </div>
        <p className="footer-version mono">v1.0 · Effective 9 June 2026 · Governed by laws of India · Jurisdiction: Ludhiana, Punjab</p>
      </footer>

      {/* ── Sticky mobile CTA ────────────────────────────────────────── */}
      <StickyBar />
    </>
  )
}
