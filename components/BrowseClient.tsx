'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Product } from './BrowseSection'
import CategoryGlyph from './CategoryGlyph'

type Props = {
  grouped:    Record<string, Product[]>
  categories: string[]
}

export default function BrowseClient({ grouped, categories }: Props) {
  const [open,           setOpen]           = useState(true)
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? '')
  const router = useRouter()
  const reduced = useReducedMotion() ?? false

  function handleBottleClick(name: string) {
    // Push URL param → SearchForm reads it via useSearchParams and pre-fills the product field.
    // Also scrolls the search form into view after a tick to let the navigation settle.
    router.push(`/?q=${encodeURIComponent(name)}`)
    setTimeout(() => {
      document.getElementById('search-anchor')?.scrollIntoView({ behavior: 'smooth' })
    }, 200)
  }

  const bodyContent = (
    <div className="browse-body">
      {/* Category pills */}
      <div className="browse-cats" role="tablist" aria-label="Bottle categories">
        {categories.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            className={`browse-cat-btn mono${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            <CategoryGlyph category={cat} />
            {cat} ({grouped[cat]?.length ?? 0})
          </button>
        ))}
      </div>

      {/* Bottle list */}
      <div role="tabpanel" aria-label={`${activeCategory} bottles`}>
        {/* key re-mounts the list on category switch so the row stagger replays */}
        <ul className="browse-list" key={activeCategory}>
          {(grouped[activeCategory] ?? []).map((product, i) => (
            <li key={product.id} style={{ '--i': Math.min(i, 12) } as React.CSSProperties}>
              <button
                className="browse-item"
                onClick={() => handleBottleClick(product.name)}
                title={`Search for ${product.name}`}
              >
                <span className="browse-item-name">{product.name}</span>
                <span className="browse-item-cta mono">Search →</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="browse-hint mono">
        Tap any bottle to pre-fill your search above.
        Availability is confirmed in real time, not guaranteed.
      </p>
    </div>
  )

  return (
    <section className="browse-section" aria-label="Browse available bottles">
      <button
        className="browse-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="browse-body"
      >
        <span className="browse-toggle-label mono">Browse available bottles in Ludhiana</span>
        <span className="browse-toggle-icon">{open ? '−' : '+'}</span>
      </button>

      {/* Height-collapse via framer-motion rather than a CSS grid-template-rows
          0fr/1fr transition: that trick doesn't reliably animate to a true zero
          across engines (fr-unit interpolation), leaving a ~40px sliver of the
          category pills visible when "collapsed". Framer Motion measures the
          real content height, so it always lands exactly on 0. Unmounting when
          closed also removes the pills/list from the tab order — the previous
          aria-hidden-only approach still left them keyboard-focusable. */}
      {reduced ? (
        open && <div id="browse-body">{bodyContent}</div>
      ) : (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="browse-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              {bodyContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  )
}
