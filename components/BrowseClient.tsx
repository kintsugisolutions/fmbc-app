'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from './BrowseSection'

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

      {open && (
        <div className="browse-body" id="browse-body">
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
                {cat} ({grouped[cat]?.length ?? 0})
              </button>
            ))}
          </div>

          {/* Bottle list */}
          <div role="tabpanel" aria-label={`${activeCategory} bottles`}>
          <ul className="browse-list">
            {(grouped[activeCategory] ?? []).map(product => (
              <li key={product.id}>
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
            Availability is confirmed in real time — not guaranteed.
          </p>
        </div>
      )}
    </section>
  )
}
