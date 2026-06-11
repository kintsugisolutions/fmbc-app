import { Suspense } from 'react'
import Image from 'next/image'
import Nav from '@/components/Nav'
import HeroContent from '@/components/HeroContent'
import BrowseSection from '@/components/BrowseSection'
import BrowseSkeleton from '@/components/BrowseSkeleton'
import HeroSkeleton from '@/components/HeroSkeleton'
import CounterSkeleton from '@/components/CounterSkeleton'
import LiveSearchCounter from '@/components/LiveSearchCounter'
import WASection from '@/components/WASection'
import FAQSection from '@/components/FAQSection'
import HowItWorks from '@/components/HowItWorks'
import Reveal from '@/components/Reveal'
import StickyBar from '@/components/StickyBar'
import ScrollCue from '@/components/ScrollCue'

// Areas covered — scrolls as a marquee in the hero. Mirrors the service-area list.
const AREAS_CAROUSEL = [
  'Model Town','BRS Nagar','Civil Lines','Sarabha Nagar','Dugri',
  'Pakhowal Road','Ferozepur Road','Gurdev Nagar','Haibowal','Raikot Road',
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
            <span className="hero-title-line"><span className="hero-title-lead">Find the bottle</span></span>
            <span className="hero-title-line"><span className="hero-title-accent">you have been looking for.</span></span>
          </h1>

          <div className="areas-block">
            <p className="areas-label mono">Covering</p>
            <div className="areas-marquee" aria-hidden="true">
              <div className="areas-track">
                {[...AREAS_CAROUSEL, ...AREAS_CAROUSEL].map((a, i) => (
                  <span key={i} className="area-pill mono">{a}</span>
                ))}
              </div>
            </div>
            <p className="sr-only">Covering {AREAS_CAROUSEL.join(', ')} and more across Ludhiana.</p>
          </div>

          {/* Live search counter — server component, hidden until total > 0 */}
          <Suspense fallback={<CounterSkeleton />}>
            <LiveSearchCounter />
          </Suspense>

          {/* Dynamic: hero-sub + ticker + form + destination mark — requires client.
              The mark (bottle for "buy", beer mug for "find a bar") lives inside
              HeroContent so it can react to the mode toggle; SearchPin lands on it. */}
          <Suspense fallback={<HeroSkeleton />}>
            <HeroContent />
          </Suspense>
        </section>

        {/* ── Browse ───────────────────────────────────────────────────── */}
        <Reveal>
          <Suspense fallback={<BrowseSkeleton />}>
            <BrowseSection />
          </Suspense>
        </Reveal>

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── WhatsApp Preview ─────────────────────────────────────────── */}
        <Reveal>
          <WASection />
        </Reveal>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <Reveal>
          <FAQSection />
        </Reveal>
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

      {/* Post-animation "Search Now" cue → smooth-scrolls to the form. Rendered at
          page root (NOT inside .hero) so position:fixed isn't trapped by the hero's
          animation transform + overflow:hidden. */}
      <ScrollCue targetId="search-form" />

      {/* ── Sticky mobile CTA ────────────────────────────────────────── */}
      <StickyBar />
    </>
  )
}
