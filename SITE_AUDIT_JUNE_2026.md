# FMBC Website Audit — June 9, 2026
**Auditor**: Claude (Builder + Secure-Build Skills)  
**Scope**: Full codebase review — security, legal/compliance, design appeal, mobile UX  
**Stack reviewed**: Next.js 14 · Supabase · n8n webhook · Vercel · IT Act / DPDP Act / Punjab Excise

---

## Scorecard Summary

| Dimension | Score | Grade |
|-----------|-------|-------|
| Security (technical) | 7.0 / 10 | B |
| Legal & Compliance | 8.0 / 10 | B+ |
| Visual Design & Brand Appeal | 8.0 / 10 | B+ |
| Mobile UX & Interactivity | 6.5 / 10 | C+ |
| SEO | 6.5 / 10 | C+ |
| Performance | 7.5 / 10 | B |
| Accessibility | 6.0 / 10 | C |
| Trust Signals & Conversion | 7.0 / 10 | B |
| Code Quality | 8.5 / 10 | A- |
| Business Risk Posture | 7.0 / 10 | B |

**Overall: 7.2 / 10** — Solid foundation with clear, actionable gaps. The legal scaffolding is well-thought-out for an MVP. The two critical blockers before scaling are the rate limiter (production bug on Vercel) and the Content Security Policy gap. The biggest trust risk is the hardcoded search counter. The biggest business risk is the "free forever" FAQ language.

---

## 1. Security — 7.0 / 10

### What's working
- Security headers in `next.config.js`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — all correctly set.
- Server-side input validation in `/api/search/route.ts`: phone regex, product length cap (200 chars), `searchType` whitelist, HTML tag stripping via `sanitise()`.
- Secrets architecture is correct: `N8N_WEBHOOK_URL` is server-only, Supabase anon key uses `NEXT_PUBLIC_` appropriately (RLS is the gate, not the key).
- TypeScript `strict: true` in tsconfig — prevents a class of runtime bugs at compile time.
- Rate limiter concept is correct (5 req / 10 min per IP).

### Critical Issues

**🔴 BLOCKER: Rate limiter does not work on Vercel (serverless)**

The `rateLimitMap` in `route.ts` is a `new Map()` in module scope. On Vercel Edge/serverless, each function invocation is potentially a separate cold-start instance. The Map does not persist between invocations. This means the rate limiter is functionally useless in production — a bot can fire unlimited requests.

**Fix**: Replace with Upstash Redis + `@upstash/ratelimit`. Free tier is sufficient for launch.

```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
})

// In handler:
const { success } = await ratelimit.limit(ip)
if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
```

Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local` and Vercel env vars.

---

**🔴 BLOCKER: No Content-Security-Policy header**

The `securityHeaders` array in `next.config.js` is missing a CSP. This is the single most important XSS mitigation header. Without it, any injected script executes freely.

**Add to `next.config.js`:**

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",   // tighten to nonce-based in v2
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://your-n8n-instance.com",
    "font-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}
```

---

**🟡 MEDIUM: n8n webhook URL exposed via network tab**

The n8n webhook URL is kept server-side (correctly), but anyone watching network traffic while submitting the form sees `POST /api/search` — not the webhook. That's fine. However, the n8n webhook itself has no token auth — it accepts any POST. If the URL leaks (from logs, server misconfiguration, etc.), it bypasses your Next.js rate limiter entirely.

**Fix**: Add a shared secret header between your Next.js API and n8n webhook.

```typescript
// In route.ts
body: JSON.stringify({ ... }),
headers: {
  'Content-Type': 'application/json',
  'X-FMBC-Secret': process.env.N8N_SECRET!,
}
```

Then validate `X-FMBC-Secret` in your n8n webhook node's header authentication.

---

**🟡 MEDIUM: Age gate bypassable via DevTools**

`sessionStorage.setItem('fmbc-age-verified', '1')` in the browser console skips the age gate. This is standard for disclosure-based age gates (the legal standard for information services in India is "reasonable effort," not technical enforcement). However, you should log gate acceptance with a timestamp in your analytics/Supabase for an audit trail under Bharatiya Sakshya Adhiniyam 2023.

---

**🟡 LOW: No CSRF protection on /api/search**

The API doesn't check `Origin` or `Referer` headers. A malicious site could submit search forms against your endpoint on behalf of your users. Since the endpoint doesn't use cookies for auth, the practical CSRF risk is low — but it's trivial to add a check.

```typescript
const origin = req.headers.get('origin')
if (origin && !origin.includes('findmybottleclub.com')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 2. Legal & Compliance — 8.0 / 10

### What's working
- Age gate blocks content before 25+ DOB confirmation — correctly implements Punjab Excise Act 1914 requirement. DOB selectors only show years ≤ current year - 25, which prevents future-date abuse.
- Privacy Policy covers: data minimisation, purpose limitation, 90-day retention, third-party processors (n8n, Interakt, Airtable), DPDP Act user rights (access, correction, erasure, consent withdrawal), Grievance Officer with contact and response SLA.
- Terms of Service correctly positions FMBC as a discovery service, not a seller. §4 (No Purchase or Fulfillment) is well-drafted.
- Consent checkbox in SearchForm links to both Privacy Policy and Terms and requires affirmative consent before submission.
- Footer disclaimer "We do not sell alcohol" is persistent on every page.
- Legal docs are versioned with effective dates — this matters for audit trails.
- `robots: 'noindex'` on legal pages — correct, prevents these from ranking (which could cause confusion).

### Issues

**🔴 HIGH BUSINESS RISK: "Free forever" FAQ language**

From `FAQSection.tsx`:
> "Founding Members who register now keep free access permanently..."

This is an unqualified contractual commitment. If you ever need to monetise, or if Founding Member volume makes the platform unsustainable, you cannot revoke this without breach of contract claims. Change to:

> "Founding Members who register during launch keep free access to core search features for the current free tier, with no time limit on that tier while it exists."

This preserves the spirit while capping your obligation.

---

**🔴 HIGH: No Data Processing Agreements with third-party processors**

The Privacy Policy correctly discloses n8n, Interakt/Meta, and Airtable as data processors. However, DPDP Act 2023 requires Data Processing Agreements (DPAs) to be in place with each processor before you go live. You cannot transfer personal data (phone numbers) to these platforms without a contractual DPA.

**Action**: Check each platform's DPA/data processing addendum and execute it:
- Airtable: Data Processing Addendum available in their legal docs — sign and retain.
- n8n Cloud: DPA available on their website.
- Meta/WhatsApp Business API via Interakt: Meta has a Data Processing Terms — Interakt should have their own DPA.

---

**🟡 MEDIUM: "Verified store" claim creates a standard of care**

From the FAQ:
> "We manually onboard each store, confirm they hold a valid Punjab excise licence, and run a test query before adding them to the network."

This is a factual claim that sets a standard. If an unlicensed store gets listed (even by mistake), this claim creates liability. Add a hedge:

> "We take reasonable steps to verify that listed stores hold valid Punjab excise licences at the time of onboarding. Licence status can change — we encourage you to confirm with the store directly."

---

**🟡 MEDIUM: No WhatsApp Business / Meta Commerce Policy acknowledgment**

Meta's WhatsApp Business Platform has restrictions on alcohol-adjacent content. Meta may flag or restrict a verified Business Account that sends alcohol availability messages. This is a platform risk, not a legal risk, but it's the highest single-point-of-failure for your core loop. There is no mitigation in the current build — no fallback if Meta restricts the number.

**Action**: Document this risk internally. Consider a backup SMS channel (Interakt supports SMS too). Do not mention Meta's content policies on the website — it draws attention to the risk — but have a fallback ready.

---

**🟢 LOW (but fix it): ASCI compliance**

If FMBC runs any paid advertising (Instagram, Google), ASCI's alcohol advertising code applies. The website itself is clean (no glamorisation, no health claims). But any Instagram or Google ad for FMBC should carry the ASCI mandatory disclaimer: "Drink Responsibly." Add this to your `fmbc-marketing` skill instructions for when campaigns go live.

---

## 3. Visual Design & Brand Appeal — 8.0 / 10

### What's working
- Dark luxury aesthetic (ink + gold) is coherent and positioned correctly for the audience.
- Subtle grain texture overlay, radial hero glow, and animated step connectors all add premium feel without being heavy.
- WhatsApp preview mockup (`WASection`) is the single most effective element on the page — it shows exactly what the user gets and builds immediate trust.
- Georgia + Courier New typography pairing creates an editorial, premium feel that fits the "members only" positioning.
- Micro-animations (shimmer loading button, pulsing dots, fadeUp on form entry) are well-executed and don't feel gratuitous.
- The live activity ticker is a strong conversion mechanism in principle.

### Issues

**🟡 Hero lacks a visual anchor**

The hero is entirely text-driven. A luxury brand benefit from a single product shot or a stylised bottle illustration above the fold. Not necessary but would lift the premium signal.

**🔴 Hardcoded search counter destroys credibility**

`HeroContent.tsx` line 12: `const SEARCH_COUNT = 34` — this is a static number hardcoded in the component. When the same person visits the site twice in the same day and sees "34 searches placed today" both times, the trust evaporates. This is worse than showing no counter at all.

Fix options:
- Pull a real count from Supabase (daily search count, server component).
- Show a lifetime count instead (changes less often, less obviously stale).
- Remove it entirely until you have real data.

**🟡 Browse section is collapsed by default**

The BrowseSection renders with `useState(true)` so it starts open — but on returning visits this creates layout shift. More importantly, the section title "Browse available bottles in Ludhiana" could benefit from showing 2-3 preview names even when collapsed to signal inventory depth.

**🟡 No social proof from humans**

The site has no store count ("X verified stores"), no human testimonials, and no confirmed-search count (for the reason above). One strong signal: once you have 10+ stores onboarded, a line like "47 verified stores across 11 areas in Ludhiana" in the hero or StickyBar would be highly effective.

---

## 4. Mobile UX & Interactivity — 6.5 / 10

This is the area with the most room for improvement. The site works on mobile but doesn't feel native to it.

### What's working
- StickyBar implementation is correct — IntersectionObserver watches the hero section, slides up when it leaves the viewport. Safe-area-inset-bottom for iPhone notch handling is present.
- Responsive breakpoints at 520px are applied correctly.
- Steps grid goes single-column on mobile.
- `inputMode="numeric"` on phone field — correct for triggering the number keyboard.
- Age gate is correctly padded on small screens.

### Issues

**🔴 PRIMARY: Form is too far down the page on mobile**

On a 375px screen, a mobile user lands and sees: eyebrow → launch strip → h1 → areas strip → hero-sub → search counter → ticker → mode toggle → members-benefit line → THEN the form. That's a lot of scrolling before the primary action. On mobile, every scroll pixel is friction.

**Fix**: Either move the form up (above the ticker) or make the hero shorter on mobile. The ticker adds credibility but it can live below the form on small screens.

---

**🔴 Missing `enterKeyHint` on search input**

The product search input shows a generic "Return" key on mobile keyboards. Adding `enterKeyHint="search"` would show a search icon on the keyboard, which is the standard affordance users expect. This is a 1-line fix with meaningful UX impact.

```tsx
<input
  type="text"
  enterKeyHint="search"   // ← add this
  ...
/>
```

---

**🟡 Browse "Tap any bottle to pre-fill" scrolls the wrong direction**

`BrowseClient.tsx` calls `router.push('/?q=...')` then `setTimeout(() => scrollIntoView, 80)`. On slow mobile devices, 80ms is not enough time for the navigation to settle before the scroll fires. The user selects a bottle from the browse section (below the hero), which causes the form to pre-fill — but they have to scroll back UP to see it and submit. The scroll sometimes doesn't fire at all.

**Fix**: Increase the timeout to 200ms. Better: use a `useEffect` in `HeroContent` that watches `searchParams` and scrolls when it changes.

---

**🟡 Mode toggle tap targets are undersized**

The Buy/Drink toggle buttons use `padding: 10px 22px`. On mobile, the rendered height is approximately 38px. WCAG 2.5.5 recommends 44×44px minimum tap targets. On small screens the buttons sometimes require a precise tap.

**Fix in globals.css**:
```css
@media (max-width: 520px) {
  .mode-btn { padding: 13px 22px; }
}
```

---

**🟡 No PWA manifest**

Given that FMBC is locality-specific and users will likely use it repeatedly (searching for different bottles over days/weeks), a PWA manifest would significantly improve repeat-use behavior. "Add to Home Screen" on iPhone/Android would give you an app-like presence without an app.

Add to `app/layout.tsx` head:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1D1F23" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

And create `/public/manifest.json` with name, icons, theme_color, display: "standalone".

---

**🟡 No skeleton loading on BrowseSection**

`BrowseSection` uses `<Suspense fallback={null}>` — the section just pops in from nothing. On slow connections this causes visible layout shift. A 3-row skeleton in gold/ink would feel more intentional.

---

**🟡 Sticky bar doesn't scroll on desktop**

The sticky bar CSS is `display: none` on screens wider than 520px. Desktop users who scroll past the form and want to search again have no persistent CTA — they have to scroll all the way up manually. A subtle "↑ Search" link in the nav (only visible after scrolling) would help desktop users too.

---

## 5. SEO — 6.5 / 10

### What's working
- Meta title and description set in layout.tsx.
- Keywords in metadata (appropriate for local search).
- SEO landing pages created for specific bottles (`/ludhiana/buy/glenfiddich`, etc.).
- Semantic HTML structure throughout.
- `lang="en"` on the html element.

### Issues

**🔴 No OpenGraph / Twitter Card metadata**

When the page is shared on WhatsApp (which is your primary acquisition channel), it renders as a plain text link with no preview image. For a WhatsApp-first platform, this is a significant gap.

Add to `layout.tsx`:
```typescript
export const metadata: Metadata = {
  ...
  openGraph: {
    title: 'Find My Bottle Club — Ludhiana',
    description: 'Search for a specific bottle. We check availability and WhatsApp you.',
    images: ['/og-image.png'],   // Create a 1200×630 OG image
    type: 'website',
  },
}
```

**🟡 No sitemap.xml or robots.txt**

Neither file is present. Next.js 14 App Router makes this easy:

```typescript
// app/sitemap.ts
export default function sitemap() {
  return [
    { url: 'https://findmybottleclub.com', lastModified: new Date() },
    { url: 'https://findmybottleclub.com/ludhiana/buy/glenfiddich', ... },
    // etc.
  ]
}
```

**🟡 No structured data (Local Business / Service schema)**

Adding `LocalBusiness` or `Service` JSON-LD would strengthen local SEO for Ludhiana searches. This is a 20-line addition to the layout that signals intent to Google.

---

## 6. Performance — 7.5 / 10

### What's working
- Server component for BrowseSection (data fetching happens at the edge, not in the browser).
- Minimal dependency tree — only `@supabase/supabase-js` and Next.js.
- `priority` prop on nav logo prevents layout shift.
- `next/image` used throughout.
- Graceful degradation on Supabase failure (BrowseSection returns null).

### Issues

**🟡 In-memory rate limiter** (already flagged in Security — same code issue, different consequence here: creates false server load due to Map growing unbounded in long-running dev sessions).

**🟡 All animations fire at page load**

`hero`, `form-wrap`, and `how-section` all have `animation: fadeUp/fadeIn` with `both` fill mode. On a slow 3G connection, the CSS might arrive after the HTML, causing a flash of unstyled content before the animation kicks in. Use `@media (prefers-reduced-motion: no-preference)` guard:

```css
@media (prefers-reduced-motion: no-preference) {
  .hero { animation: fadeUp 0.55s ease both; }
  .form-wrap { animation: fadeUp 0.65s 0.1s ease both; }
}
```

This also improves accessibility for users with vestibular disorders.

**🟡 Grain texture may trigger GPU compositing on mobile**

`body::before` with `position: fixed` and a large SVG background creates a compositing layer. On lower-end Android devices this can cause jank. Test on a mid-range Android (Redmi 10-class) specifically.

---

## 7. Accessibility — 6.0 / 10

### What's working
- ARIA roles and attributes are thoughtfully applied: `aria-expanded`, `aria-label`, `aria-controls`, `role="tablist"`, `role="tab"`.
- StickyBar has keyboard handler (`onKeyDown` for Enter).
- Age gate selects have explicit `aria-label` values.

### Issues

**🔴 Form error messages don't announce to screen readers**

In `SearchForm.tsx` and `AgeGate.tsx`, error messages are rendered as plain `<p>` elements. Screen readers won't announce them when they appear dynamically.

```tsx
// Change:
{error && <p className="form-error">{error}</p>}
// To:
{error && <p className="form-error" role="alert" aria-live="polite">{error}</p>}
```

Apply the same fix to `dobError` in `AgeGate.tsx`.

**🟡 Color contrast likely fails on smallest text**

The dim color `#4A4438` on ink `#1D1F23` — 9px Courier New at this contrast ratio almost certainly fails WCAG AA (4.5:1 for small text). The `footer-version` class and `browse-hint` are both using this. These aren't critical user-flow elements, but worth reviewing with a contrast checker.

The gold `#D2A74F` on ink `#1D1F23` should pass for large/bold text but borderline for the small monospaced labels.

**🟡 No skip navigation link**

Keyboard users have no way to skip the sticky nav. A single `<a href="#search-anchor" className="sr-only">Skip to search</a>` as the first child of `<body>` fixes this.

**🟡 `role="tabpanel"` on `<ul>` is semantically incorrect**

In `BrowseClient.tsx`, the `<ul className="browse-list" role="tabpanel">` is technically wrong — a tabpanel should be a `<div>` wrapping the list, not the list itself. Minor issue but will confuse AT.

---

## 8. Trust Signals & Conversion — 7.0 / 10

### What's working
- WhatsApp preview mockup is the strongest trust element on the page.
- Live ticker (even seeded) creates activity signal.
- "Avg. reply in ~47 min" response badge sets expectations.
- Consent checkbox that explicitly states data use — unusual and trust-building.
- Area coverage pills signal local specificity.

### Issues

**🔴 Hardcoded search counter kills trust** (see §3 — same issue, different consequence here).

**🟡 Founding Members benefit is under-sold**

`members-benefit` line reads: "✦ Founding Members get wishlist access & community reviews" — this is a 10px font below the mode toggle. If this is a conversion mechanism, it deserves its own section with clarity on what Founding Membership actually means and any time pressure ("first 200 members").

**🟡 No store count or network size indicator**

"We check our verified store network" — but how big is it? Even "12 verified stores and growing" is more trustworthy than no number at all. Once you have onboarded your first 10 stores, add a live or updated-weekly number to the hero.

---

## 9. Code Quality — 8.5 / 10

The codebase is clean. The server/client component split is thoughtful (BrowseSection fetches server-side, interactive bits are client components). Error handling is consistent — the Supabase failure mode returns null rather than crashing. Comments are purposeful.

The main issues are already captured above: in-memory rate limiter is a production bug disguised as a development convenience, and `SEARCH_COUNT` being hardcoded requires a deploy to update.

No tests is acceptable for launch but should be addressed before you have paying subscribers whose searches could break silently.

---

## 10. Business Risk Posture — 7.0 / 10

### Risks by Priority

| Risk | Severity | Status |
|------|----------|--------|
| Rate limiter ineffective on Vercel | HIGH | ❌ Not fixed |
| "Free forever" FAQ language | HIGH | ❌ Not fixed |
| No DPAs with data processors | HIGH | ❌ Not confirmed |
| n8n webhook has no token auth | MEDIUM | ❌ Not fixed |
| Age gate bypassable via DevTools | MEDIUM | ⚠️ Acceptable for MVP (disclose in legal docs) |
| WhatsApp/Meta content policy risk | MEDIUM | ⚠️ No fallback channel |
| "Verified store" creates standard of care | MEDIUM | ❌ Not hedged |
| No OpenGraph for WhatsApp sharing | LOW | ❌ Not implemented |
| No registered entity listed in legal docs | LOW | ⚠️ Flag for legal review |

---

## Action Priority List (What to fix first)

### Before scaling to paid subscribers — MUST FIX
1. Replace in-memory rate limiter with Upstash Redis
2. Add Content-Security-Policy header to `next.config.js`
3. Fix "free forever" FAQ copy
4. Execute DPAs with n8n, Airtable, and Interakt
5. Add `X-FMBC-Secret` token auth to n8n webhook calls
6. Fix hardcoded `SEARCH_COUNT` — pull from Supabase or remove

### Before your first marketing push — SHOULD FIX
7. Add OpenGraph metadata + OG image for WhatsApp/Instagram shares
8. Add `enterKeyHint="search"` on product input
9. Add `role="alert"` to form and age-gate error messages
10. Increase mode toggle tap target on mobile
11. Hedge "verified store" FAQ language
12. Add `/sitemap.ts` and `/public/robots.txt`

### Nice to have before 100 users
13. PWA manifest (Add to Home Screen)
14. Skeleton loading on BrowseSection
15. `@media (prefers-reduced-motion)` guard on animations
16. Store count display in hero/nav
17. Skip navigation link for keyboard users
18. Real-time or live search counter from Supabase

---

## Compliance Output

**Product**: Find My Bottle Club v1.0 — 2026-06-09  
**Sector**: Alcohol Discovery — Punjab Excise Act 1914, DPDP Act 2023, IT Act 2000, BNS 2023 §61

| Component | Governing Law | Version | Status |
|-----------|--------------|---------|--------|
| Age Gate (25+, DOB) | Punjab Excise Act 1914, BNS §61 | v1.0 | ✅ Implemented |
| Platform Disclaimer (no-sale) | Punjab Excise Act 1914 §34 | v1.0 | ✅ Implemented (footer) |
| Consent Checkbox | DPDP Act 2023 §6 | v1.0 | ✅ Implemented |
| Privacy Policy | DPDP Act 2023, IT Act §43A | v1.0 | ✅ Implemented — ⚠️ Legal review recommended |
| Terms of Service | IT Act 2000, Indian Contract Act | v1.0 | ✅ Implemented — ⚠️ "Free forever" language needs fix |
| Grievance Officer | IT Rules 2021 Rule 3(2) | v1.0 | ✅ Implemented |
| Data Processor DPAs | DPDP Act 2023 | — | ❌ Not confirmed — must execute before launch |

| Security Layer | Status | Notes |
|----------------|--------|-------|
| No credentials in client code | ✅ | NEXT_PUBLIC keys are anon-safe |
| Input sanitisation | ✅ | HTML stripping + field validation on server |
| HTTP security headers | ⚠️ Partial | CSP missing — critical gap |
| Rate limiting | ❌ | In-memory Map won't work on Vercel serverless |
| Webhook auth | ❌ | n8n webhook has no shared-secret validation |
| CSRF protection | ⚠️ Partial | No cookies = lower risk; Origin check still recommended |

**Referred to External Counsel?**: Not yet. Recommend a one-time review of Privacy Policy and Terms before you have >100 paying subscribers or before any brand/distributor data product launches. The current docs are solid for MVP.
