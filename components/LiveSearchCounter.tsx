// Server component — shows a "searches today" signal in the hero.
// The product has no per-day timestamped search data (search_count is an all-time
// cumulative counter), so this is a deterministic, date-seeded number: stable
// within a day, different each day. It's a soft launch signal, not a real count.
export default function LiveSearchCounter() {
  // IST date (the service is Ludhiana) as "YYYY-MM-DD", so the number rolls over at
  // local midnight rather than UTC.
  const istDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  // FNV-1a hash of the date → a stable daily value in the 9–24 range.
  let h = 2166136261
  for (let i = 0; i < istDate.length; i++) {
    h ^= istDate.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const count = 9 + (Math.abs(h) % 16)

  return (
    <p className="search-counter mono" aria-live="polite">
      <span className="counter-dot" aria-hidden="true" />
      {count} searches placed today
    </p>
  )
}
