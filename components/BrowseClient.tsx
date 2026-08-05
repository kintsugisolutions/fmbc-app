'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  function handleBottleClick(name: string) {
    // Push URL param → SearchForm reads it via useSearchParams and pre-fills the product field.
    // Also scrolls the search form into view after a tick to let the navigation settle.
    router.push(`/?q=${encodeURIComponent(name)}`)
    setTimeout(() => {
      document.getElementById('search-anchor')?.scrollIntoView({ behavior: 'smooth' })
    }, 200)
  }

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

      <div
        className={`browse-body-wrap${open ? ' browse-body-wrap--open' : ''}`}
        id="browse-body"
        aria-hidden={!open}
      >
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
      </div>
    </section>
  )
}
