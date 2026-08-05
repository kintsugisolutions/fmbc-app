// Engraved vessel glyphs for the Browse category pills — one silhouette per
// category, drawn in a single 1.3 stroke and inheriting currentColor so they
// follow the pill's muted → gold → ink state colors. Sized for the 9px pills.

const STROKE = { stroke: 'currentColor', strokeWidth: 1.3, fill: 'none', strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

const GLYPHS: Record<string, React.ReactNode> = {
  // Square-shouldered whisky bottle with a slanted label line
  Whisky: (
    <svg width="11" height="15" viewBox="0 0 11 15" aria-hidden="true">
      <path d="M3.5 1.5h4v2.2h-.7v2l2 2.6v5.2q0 1-1 1h-4.6q-1 0-1-1V8.3l2-2.6v-2h-.7z" {...STROKE} />
      <path d="M2.8 11l5.4-1.6" {...STROKE} opacity=".7" />
    </svg>
  ),
  // Stout mug with foam
  Beer: (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M9.8 5.6c2 0 2.2 1 2.2 2s-.2 2.4-2.2 2.4" {...STROKE} />
      <path d="M2.6 3.8h7.2l-.5 8q0 .7-.8.7H3.9q-.8 0-.8-.7z" {...STROKE} />
      <path d="M2.4 3.8c-.8-1.8.3-3 1.5-2.3.5-1.3 4-1.3 4.5 0 1.2-.7 2.3.5 1.5 2.3z" {...STROKE} />
    </svg>
  ),
  // Broad round-shouldered gin bottle with oval label
  Gin: (
    <svg width="12" height="15" viewBox="0 0 12 15" aria-hidden="true">
      <path d="M4.6 1.5h2.8v1.8h-.5v1.4c1.6.6 2.6 1.6 2.6 3.5v4.3q0 1-1 1H3.5q-1 0-1-1V8.2c0-1.9 1-2.9 2.6-3.5V3.3h-.5z" {...STROKE} />
      <ellipse cx="6" cy="9.4" rx="1.9" ry="2.3" {...STROKE} opacity=".7" />
    </svg>
  ),
  // Tall sleek vodka bottle
  Vodka: (
    <svg width="10" height="15" viewBox="0 0 10 15" aria-hidden="true">
      <path d="M3.6 1h2.8v1.6h-.5v2c.9.6 1.4 1 1.4 2.4v6q0 1-1 1H3.7q-1 0-1-1V7c0-1.4.5-1.8 1.4-2.4v-2h-.5z" {...STROKE} />
      <path d="M3.4 10.6h3.2" {...STROKE} opacity=".7" />
    </svg>
  ),
  // Round-bellied rum bottle
  Rum: (
    <svg width="13" height="15" viewBox="0 0 13 15" aria-hidden="true">
      <path d="M5.1 1.3h2.8v1.9h-.5v1.5c1.9.7 3.1 2.2 3.1 4.3 0 2.5-1.8 4.5-4 4.5s-4-2-4-4.5c0-2.1 1.2-3.6 3.1-4.3V3.2h-.5z" {...STROKE} />
      <path d="M4.4 9h4.2" {...STROKE} opacity=".7" />
    </svg>
  ),
  // Short shoulder bottle + shot glass for the catch-all category
  'Tequila & Others': (
    <svg width="14" height="15" viewBox="0 0 14 15" aria-hidden="true">
      <path d="M3 1.5h2.6v1.7h-.5v1.2l1.7 1.8v6.4q0 .9-.9.9H2.2q-.9 0-.9-.9V6.2l1.7-1.8V3.2H2.5z" {...STROKE} />
      <path d="M9.3 9.4h3.9l-.5 4h-2.9z" {...STROKE} />
    </svg>
  ),
}

export default function CategoryGlyph({ category }: { category: string }) {
  return <>{GLYPHS[category] ?? GLYPHS['Tequila & Others']}</>
}
