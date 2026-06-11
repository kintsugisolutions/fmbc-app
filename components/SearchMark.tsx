'use client'
import { motion, useReducedMotion } from 'framer-motion'

// The static destination mark under the search section that SearchPin lands on.
// Buy mode → a Johnnie Walker-style square bottle (slanted label). Find-a-bar mode
// → a stout beer mug (foam head + handle). The mark fades in when the mode toggles.
// Carries id="search-mark" so SearchPin can target whichever silhouette is shown.

function BottleSilhouette() {
  return (
    <svg width="44" height="92" viewBox="0 0 44 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 5 L28 5 L28 13 L26 13 L26 24 L36 39 L36 83 Q36 88 31 88 L13 88 Q8 88 8 83 L8 39 L18 24 L18 13 L16 13 Z"
        fill="rgba(210,167,79,0.05)" stroke="#D2A74F" strokeWidth="1.6" strokeLinejoin="round"
      />
      {/* Slanted label */}
      <path d="M12 64 L32 56 L32 48 L12 56 Z" fill="none" stroke="#E8C878" strokeWidth="1.3" strokeLinejoin="round" opacity="0.85" />
    </svg>
  )
}

function MugSilhouette() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <path d="M42 26 C52 26 53 31 53 36 C53 43 52 48 42 48" fill="none" stroke="#D2A74F" strokeWidth="1.7" strokeLinejoin="round" />
      {/* Glass body */}
      <path
        d="M12 18 L42 18 L40 53 Q40 56 37 56 L17 56 Q14 56 14 53 Z"
        fill="rgba(210,167,79,0.05)" stroke="#D2A74F" strokeWidth="1.7" strokeLinejoin="round"
      />
      {/* Beer level line */}
      <line x1="15" y1="27" x2="39" y2="27" stroke="#E8C878" strokeWidth="1.2" opacity="0.55" />
      {/* Foam head */}
      <path
        d="M11 18 C8 9 13 4 18 7 C20 1 30 1 32 7 C38 4 43 9 41 18 Z"
        fill="rgba(232,200,120,0.08)" stroke="#E8C878" strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SearchMark({ mode }: { mode: 'buy' | 'drink' }) {
  const reduced = useReducedMotion()
  const isMug = mode === 'drink'

  return (
    <div className="search-mark" id="search-mark" aria-hidden="true">
      <motion.div
        key={mode}
        className="search-mark-svg"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {isMug ? <MugSilhouette /> : <BottleSilhouette />}
        {/* Exact landing point for SearchPin — top-centre of the silhouette. The
            mug's mouth sits left of its SVG centre (the handle pulls the box right),
            so it aims at 45% of the SVG width; the bottle is symmetric at 50%. */}
        <span
          id="search-mark-aim"
          className="search-mark-aim"
          style={{ left: isMug ? '45%' : '50%' }}
        />
      </motion.div>
      <span className="search-mark-base" />
    </div>
  )
}
