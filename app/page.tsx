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
import CellarShelf from '@/components/CellarShelf'

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
          {/* Etched crest watermark — engraved bottle + rocks glass in a hairline
              ring on the hero's right flank. Decorative, desktop only (CSS). */}
          <div className="hero-etch" aria-hidden="true">
            <svg viewBox="0 0 340 460" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="170" cy="235" r="150" stroke="#D2A74F" strokeWidth="1.2" opacity="0.5" />
              <circle cx="170" cy="235" r="141" stroke="#D2A74F" strokeWidth="0.8" opacity="0.3" />
              <path
                d="M138 118 H182 V140 H176 V176 L204 214 V370 Q204 382 192 382 H128 Q116 382 116 370 V214 L144 176 V140 H138 Z"
                stroke="#D2A74F" strokeWidth="1.4" strokeLinejoin="round"
              />
              <path d="M124 300 L196 282 M124 314 L196 296" stroke="#D2A74F" strokeWidth="1.1" opacity="0.7" />
              <path
                d="M222 320 H286 L281 384 Q281 390 275 390 H233 Q227 390 227 384 Z"
                stroke="#D2A74F" strokeWidth="1.4" strokeLinejoin="round"
              />
              <path d="M228 352 H280" stroke="#D2A74F" strokeWidth="1.1" opacity="0.7" />
              <path d="M108 396 H294" stroke="#D2A74F" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>

          <div className="launch-strip">
            <span className="launch-dot" />
            <span className="launch-text mono">Launching in Ludhiana · New stores added every day</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line"><span className="hero-title-lead">Find the bottle</span></span>
            <span className="hero-title-line"><span className="hero-title-accent">you have been looking for.</span></span>
          </h1>

          <Image
            src="/fmbc-mark-foil.svg"
            alt=""
            width={72}
            height={101}
            className="hero-mark"
            priority
          />

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

        {/* ── Cellar shelf — engraved closing image, draws in on scroll ── */}
        <CellarShelf />
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
