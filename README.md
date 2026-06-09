# Find My Bottle Club — Web App

Next.js 14 frontend for the FMBC availability signal platform.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Open `.env.local` and paste your n8n webhook URL as `N8N_WEBHOOK_URL`.

3. **Run locally**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Connect the repo to Vercel
3. In Vercel → Project Settings → Environment Variables, add:
   - `N8N_WEBHOOK_URL` = your n8n webhook URL
4. Deploy

**Important:** `N8N_WEBHOOK_URL` is a server-side env variable (no `NEXT_PUBLIC_` prefix).
It is never exposed to the browser. The API route at `/api/search` is the only thing
that touches the webhook.

## Structure

```
app/
  page.tsx                    ← Homepage with search form
  layout.tsx                  ← Root layout + metadata
  globals.css                 ← All styles
  api/
    search/
      route.ts                ← Proxies searches to n8n webhook
  ludhiana/
    buy/
      glenfiddich/page.tsx    ← SEO page
      jameson/page.tsx        ← SEO page
      hendricks-gin/page.tsx  ← SEO page
      johnnie-walker/page.tsx ← SEO page
      corona-beer/page.tsx    ← SEO page

components/
  Nav.tsx                     ← Sticky navigation bar
  ModeToggle.tsx              ← Buy a Bottle / Drink Now switcher
  SearchForm.tsx              ← Main search form with validation
  SearchResult.tsx            ← Post-submission confirmation
```

## SEO Pages

Live at:
- `/ludhiana/buy/glenfiddich`
- `/ludhiana/buy/jameson`
- `/ludhiana/buy/hendricks-gin`
- `/ludhiana/buy/johnnie-walker`
- `/ludhiana/buy/corona-beer`

To add more SEO pages: duplicate any page in `app/ludhiana/buy/` and update the
brand name, description, and keywords in the metadata export.

## Legal note

This app does not sell alcohol, process payments, or facilitate delivery.
It is an availability signal service. The API route forwards searches to n8n.
No transaction occurs through this codebase.
