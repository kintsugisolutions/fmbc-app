import { createAdminClient } from '@/lib/supabase-admin'
import { groupForReview, type UnreviewedProduct } from '@/lib/normalize-sku'
import { approveProduct, rejectProduct, markQueueSeen } from './actions'
import { CATEGORY_OPTIONS } from './constants'
import { logoutAction } from '../login/actions'

export const dynamic = 'force-dynamic' // always fresh — this is an internal ops dashboard, no caching

function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function countSince(rows: { created_at: string }[], iso: string) {
  const t = new Date(iso).getTime()
  return rows.filter((r) => new Date(r.created_at).getTime() >= t).length
}

function topCounts(values: (string | null)[], limit = 8) {
  const counts = new Map<string, number>()
  for (const v of values) {
    const key = v && v.trim() ? v.trim() : 'Unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit)
}

// Phone numbers are the most sensitive thing in this database. The dashboard
// never needs the full number to do its job, so show only the last 4 digits —
// enough to correlate a row with a WhatsApp thread if you're debugging, not
// enough to leak a contact list from a screenshot.
function maskPhone(phone: string | null): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '—'
  return `••••${digits.slice(-4)}`
}

interface WatchlistRow {
  id: string
  user_phone: string
  raw_search_text: string
  normalized_key: string
  area: string
  status: string
  created_at: string
}

interface WatchCluster {
  key: string
  waiting: number // distinct people
  variants: string[] // the raw strings people actually typed
  areas: [string, number][]
  latest: string
}

// Groups Active watchers by normalised SKU key — the same key the review queue
// uses, so phrasing variants collapse into one cohort. This table is the
// distributor/store pitch in raw form: "N people in <area> are waiting on X".
function clusterWatchlist(rows: WatchlistRow[]): WatchCluster[] {
  const map = new Map<string, { phones: Set<string>; variants: Set<string>; areas: Map<string, number>; latest: string }>()

  for (const r of rows) {
    if (r.status !== 'Active') continue
    const existing = map.get(r.normalized_key)
    const entry = existing ?? { phones: new Set<string>(), variants: new Set<string>(), areas: new Map<string, number>(), latest: r.created_at }
    entry.phones.add(r.user_phone)
    entry.variants.add(r.raw_search_text)
    entry.areas.set(r.area, (entry.areas.get(r.area) ?? 0) + 1)
    if (new Date(r.created_at).getTime() > new Date(entry.latest).getTime()) entry.latest = r.created_at
    if (!existing) map.set(r.normalized_key, entry)
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      waiting: v.phones.size,
      variants: Array.from(v.variants),
      areas: Array.from(v.areas.entries()).sort((a, b) => b[1] - a[1]),
      latest: v.latest,
    }))
    .sort((a, b) => b.waiting - a.waiting)
}

export default async function InternalDashboardPage() {
  const supabase = createAdminClient()

  const [
    { data: allSearches },
    { data: venueQueries },
    { data: catalogProducts },
    { data: unreviewedRaw },
    { data: checkpoint },
    { data: pageViews },
    { data: recentRuns },
    { data: watchlistRaw },
  ] = await Promise.all([
    supabase.from('user_searches').select('id, area, created_at, status'),
    supabase.from('venue_queries').select('id, status, sent_at, replied_at'),
    supabase
      .from('products')
      .select('id, name, category, search_count, is_available')
      .eq('is_available', true)
      .order('search_count', { ascending: false })
      .limit(10),
    supabase
      .from('products')
      .select('id, name, category, search_count, created_at, reviewed_at, merged_into_id')
      .eq('category', 'Unreviewed')
      .is('reviewed_at', null)
      .is('merged_into_id', null)
      .order('created_at', { ascending: false }),
    supabase.from('dashboard_checkpoints').select('last_reviewed_queue_view_at').eq('id', 1).maybeSingle(),
    supabase
      .from('page_views')
      .select('id, path, country, region, city, referrer, created_at')
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase.from('review_runs').select('run_at, total_unreviewed, new_since_last_run, notes').order('run_at', { ascending: false }).limit(5),
    supabase
      .from('watchlists')
      .select('id, user_phone, raw_search_text, normalized_key, area, status, created_at')
      .order('created_at', { ascending: false })
      .limit(2000),
  ])

  const searches = allSearches ?? []
  const vq = venueQueries ?? []
  const pv = pageViews ?? []
  const watchlist = (watchlistRaw ?? []) as WatchlistRow[]

  const searchToday = countSince(searches, daysAgoIso(1))
  const search7d = countSince(searches, daysAgoIso(7))
  const search30d = countSince(searches, daysAgoIso(30))
  const searchAllTime = searches.length

  const respondedCount = vq.filter((q) => q.status && q.status !== 'Pending').length
  const responseRate = vq.length > 0 ? Math.round((respondedCount / vq.length) * 100) : null

  const topAreas = topCounts(searches.map((s) => s.area))

  const viewsToday = countSince(pv, daysAgoIso(1))
  const views7d = countSince(pv, daysAgoIso(7))
  const views30d = countSince(pv, daysAgoIso(30))
  const viewsAllTime = pv.length
  const topCountries = topCounts(pv.map((p) => p.country))
  const topCities = topCounts(pv.map((p) => (p.city ? decodeURIComponent(p.city) : p.city)))
  const topPaths = topCounts(pv.map((p) => p.path))
  const topReferrers = topCounts(pv.map((p) => p.referrer).filter((r) => r && !r.includes('findmybottle.club')))

  const unreviewed = (unreviewedRaw ?? []) as UnreviewedProduct[]
  const since = checkpoint?.last_reviewed_queue_view_at ?? null
  const groups = groupForReview(unreviewed, since)
  const newGroupCount = groups.filter((g) => g.isNew).length

  const activeWatchers = watchlist.filter((w) => w.status === 'Active')
  const notifiedWatchers = watchlist.filter((w) => w.status === 'Notified')
  const expiredWatchers = watchlist.filter((w) => w.status === 'Expired')
  const watchClusters = clusterWatchlist(watchlist)

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.h1}>FMBC Internal Dashboard</h1>
        <form action={logoutAction}>
          <button type="submit" style={styles.linkBtn}>Log out</button>
        </form>
      </div>

      <Section title="Search volume">
        <div style={styles.kpiRow}>
          <Kpi label="Today" value={searchToday} />
          <Kpi label="7 days" value={search7d} />
          <Kpi label="30 days" value={search30d} />
          <Kpi label="All time" value={searchAllTime} />
        </div>
      </Section>

      <Section title="Store response health">
        <div style={styles.kpiRow}>
          <Kpi label="Queries sent" value={vq.length} />
          <Kpi label="Responded" value={respondedCount} />
          <Kpi label="Response rate" value={responseRate === null ? '—' : `${responseRate}%`} />
        </div>
        <p style={styles.hint}>
          This is the fragile core of the loop — watch for sustained drops. Low response rate usually means
          template fatigue, wrong number formatting, or a store gone inactive, not a product problem.
        </p>
      </Section>

      <Section title={`Unmet demand — ${activeWatchers.length} people waiting across ${watchClusters.length} SKU${watchClusters.length === 1 ? '' : 's'}`}>
        <div style={styles.kpiRow}>
          <Kpi label="Active" value={activeWatchers.length} />
          <Kpi label="Notified" value={notifiedWatchers.length} />
          <Kpi label="Expired" value={expiredWatchers.length} />
        </div>
        <p style={styles.hint}>
          Everyone whose search wasn&apos;t confirmed is waiting here until a store confirms that SKU
          (or 60 days pass). Grouped by the same normalised key the review queue uses, so
          &quot;Jack Daniels&quot; and &quot;jack daniel&apos;s 750ml&quot; count as one cohort.
          <strong> This table is the store and distributor pitch in raw form</strong> — a row saying
          8 people in Model Town are waiting on a SKU is demand that store is currently missing.
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>SKU (normalised)</th>
              <th style={styles.th}>People waiting</th>
              <th style={styles.th}>Areas</th>
              <th style={styles.th}>As typed</th>
              <th style={styles.th}>Latest</th>
            </tr>
          </thead>
          <tbody>
            {watchClusters.slice(0, 25).map((c) => (
              <tr key={c.key}>
                <td style={styles.td}><strong>{c.key}</strong></td>
                <td style={styles.td}>{c.waiting}</td>
                <td style={styles.td}>{c.areas.map(([a, n]) => `${a} (${n})`).join(', ')}</td>
                <td style={{ ...styles.td, color: '#9a9587' }}>{c.variants.join(' · ')}</td>
                <td style={styles.td}>{new Date(c.latest).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {watchClusters.length === 0 && (
          <p style={styles.hint}>Nobody waiting yet — this fills up as searches come in without a confirmation.</p>
        )}
      </Section>

      <Section title="Watchlist inputs — raw, for review">
        <p style={styles.hint}>
          The exact text each person typed, newest first. Same exploit surface as the review queue:
          this is unvalidated user input, so scan it for junk or abuse. Nothing here is ever published
          to the catalog — approving a SKU still happens only in the review queue below. Phone numbers
          are masked to the last 4 digits on purpose.
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>As typed</th>
              <th style={styles.th}>Normalised to</th>
              <th style={styles.th}>Area</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.slice(0, 40).map((w) => (
              <tr key={w.id}>
                <td style={styles.td}>{w.raw_search_text}</td>
                <td style={{ ...styles.td, color: '#9a9587' }}>{w.normalized_key}</td>
                <td style={styles.td}>{w.area}</td>
                <td style={styles.td}>{maskPhone(w.user_phone)}</td>
                <td style={styles.td}>{w.status}</td>
                <td style={styles.td}>{new Date(w.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {watchlist.length === 0 && <p style={styles.hint}>No watchlist entries yet.</p>}
      </Section>

      <Section title="Site traffic">
        <div style={styles.kpiRow}>
          <Kpi label="Today" value={viewsToday} />
          <Kpi label="7 days" value={views7d} />
          <Kpi label="30 days" value={views30d} />
          <Kpi label="All time" value={viewsAllTime} />
        </div>
        <div style={styles.twoCol}>
          <MiniTable title="Top locations (country)" rows={topCountries} />
          <MiniTable title="Top cities" rows={topCities} />
          <MiniTable title="Top pages" rows={topPaths} />
          <MiniTable title="Top referrers (external)" rows={topReferrers} />
        </div>
      </Section>

      <Section title="Top catalog products (by search volume)">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Searches</th>
            </tr>
          </thead>
          <tbody>
            {(catalogProducts ?? []).map((p) => (
              <tr key={p.id}>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.category}</td>
                <td style={styles.td}>{p.search_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <MiniTable title="Top search areas" rows={topAreas} />
      </Section>

      <Section title={`Review queue — ${groups.length} unique term${groups.length === 1 ? '' : 's'}${newGroupCount ? `, ${newGroupCount} new` : ''}`}>
        <p style={styles.hint}>
          Nothing here ever goes live automatically. Each row below is a normalized-text group of
          searches that didn&apos;t match the catalog — different phrasing of the same product is grouped
          together so you can approve or merge in one pass. Approving publishes only the exact stored
          name of the item you pick as the source; nothing is auto-merged or auto-published on its own.
        </p>
        <form action={markQueueSeen} style={{ marginBottom: 16 }}>
          <button type="submit" style={styles.secondaryBtn}>Mark queue as reviewed (clears NEW badges)</button>
        </form>

        {groups.length === 0 && <p style={styles.hint}>Queue is empty — no unreviewed searches right now.</p>}

        {groups.map((group) => (
          <div key={group.key} style={styles.reviewGroup}>
            <div style={styles.reviewGroupHeader}>
              {group.isNew && <span style={styles.newBadge}>NEW</span>}
              <strong>{group.key || '(blank)'}</strong>
              <span style={styles.hint}>&nbsp;— {group.totalSearchCount} total searches across {group.items.length} variant{group.items.length === 1 ? '' : 's'}</span>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Raw text</th>
                  <th style={styles.th}>Searches</th>
                  <th style={styles.th}>First seen</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>{item.search_count}</td>
                    <td style={styles.td}>{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.actionsRow}>
              <form action={approveProduct} style={styles.inlineForm}>
                <input type="hidden" name="id" value={group.items[0].id} />
                <input
                  type="hidden"
                  name="mergeIds"
                  value={group.items.slice(1).map((i) => i.id).join(',')}
                />
                <input
                  type="text"
                  name="name"
                  defaultValue={group.items[0].name}
                  style={styles.input}
                  aria-label="Catalog name to publish"
                />
                <select name="category" defaultValue="" required style={styles.input}>
                  <option value="" disabled>Category…</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button type="submit" style={styles.approveBtn}>Approve & publish</button>
              </form>

              {group.items.map((item) => (
                <form action={rejectProduct} key={item.id} style={styles.inlineForm}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" style={styles.rejectBtn}>Reject &quot;{item.name}&quot;</button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Recent nightly runs">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Run at</th>
              <th style={styles.th}>Total unreviewed</th>
              <th style={styles.th}>New since last run</th>
              <th style={styles.th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {(recentRuns ?? []).map((r, i) => (
              <tr key={i}>
                <td style={styles.td}>{new Date(r.run_at).toLocaleString()}</td>
                <td style={styles.td}>{r.total_unreviewed}</td>
                <td style={styles.td}>{r.new_since_last_run}</td>
                <td style={{ ...styles.td, color: '#9a9587' }}>{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      {children}
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={styles.kpi}>
      <div style={styles.kpiValue}>{value}</div>
      <div style={styles.kpiLabel}>{label}</div>
    </div>
  )
}

function MiniTable({ title, rows }: { title: string; rows: [string, number][] }) {
  if (rows.length === 0) return null
  return (
    <div style={{ minWidth: 200 }}>
      <div style={styles.miniTableTitle}>{title}</div>
      {rows.map(([k, v]) => (
        <div key={k} style={styles.miniTableRow}>
          <span>{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#12130f',
    color: '#e8e2d4',
    fontFamily: 'ui-monospace, monospace',
    padding: '32px 24px 80px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  h1: { fontSize: 20, letterSpacing: 0.5, margin: 0 },
  h2: { fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#c9a24b', marginBottom: 12 },
  section: { marginBottom: 40, borderTop: '1px solid #262720', paddingTop: 24 },
  kpiRow: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 },
  kpi: { background: '#1c1d18', border: '1px solid #33342b', borderRadius: 6, padding: '14px 20px', minWidth: 100 },
  kpiValue: { fontSize: 22, fontWeight: 600 },
  kpiLabel: { fontSize: 11, color: '#9a9587', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { fontSize: 12, color: '#9a9587', lineHeight: 1.5, marginTop: 4 },
  twoCol: { display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 12 },
  miniTableTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#9a9587', marginBottom: 6 },
  miniTableRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid #1e1f19', width: 200 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 },
  th: { textAlign: 'left', borderBottom: '1px solid #33342b', padding: '6px 8px', color: '#9a9587', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' },
  td: { borderBottom: '1px solid #1e1f19', padding: '6px 8px', verticalAlign: 'top' },
  reviewGroup: { background: '#1c1d18', border: '1px solid #33342b', borderRadius: 6, padding: 16, marginBottom: 16 },
  reviewGroupHeader: { marginBottom: 4, fontSize: 14 },
  newBadge: { background: '#c9a24b', color: '#12130f', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, marginRight: 8, letterSpacing: 0.5 },
  actionsRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' },
  inlineForm: { display: 'flex', gap: 6, alignItems: 'center' },
  input: { background: '#12130f', border: '1px solid #33342b', borderRadius: 4, color: '#e8e2d4', padding: '6px 8px', fontSize: 12, fontFamily: 'inherit' },
  approveBtn: { background: '#5c8a5c', border: 'none', borderRadius: 4, color: '#0f120f', fontWeight: 600, padding: '7px 12px', fontSize: 12, cursor: 'pointer' },
  rejectBtn: { background: '#33342b', border: '1px solid #4a4b3f', borderRadius: 4, color: '#e08585', padding: '7px 12px', fontSize: 12, cursor: 'pointer' },
  secondaryBtn: { background: 'transparent', border: '1px solid #33342b', borderRadius: 4, color: '#c9a24b', padding: '8px 14px', fontSize: 12, cursor: 'pointer' },
  linkBtn: { background: 'transparent', border: 'none', color: '#9a9587', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' },
}
