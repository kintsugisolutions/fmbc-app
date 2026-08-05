'use client'
import { motion, useReducedMotion } from 'framer-motion'

// The page's closing image — an engraved cellar shelf: six vessel silhouettes
// (whisky, wine, champagne, gin, a decanter, a coupe) standing on a hairline
// shelf. On scroll into view the shelf rules itself in first, then each vessel
// draws in sequence, like an engraver finishing a label. Decorative only.

const GOLD = 'rgba(210,167,79,0.75)'
const GOLD_SOFT = 'rgba(210,167,79,0.45)'

// [d, detail?] — detail is a lighter secondary line (label, liquid, foil)
const VESSELS: Array<{ d: string; detail?: string }> = [
  // Square-shouldered whisky bottle, slanted label
  { d: 'M50 179 V96 L62 79 V57 H59 V49 H81 V57 H78 V79 L90 96 V179',
    detail: 'M55 145 L85 136 M55 154 L85 145' },
  // Burgundy wine bottle, foil line at the neck
  { d: 'M147 179 V113 C147 98 152 91 154 83 V44 H151 V36 H169 V44 H166 V83 C168 91 173 98 173 113 V179',
    detail: 'M154 56 H166' },
  // Champagne — fatter shoulders, cork and wire cage
  { d: 'M232 179 V116 C232 98 238 92 241 86 V54 H238 V45 H262 V54 H259 V86 C262 92 268 98 268 116 V179',
    detail: 'M245 45 V37 H255 V45 M242 41 H258' },
  // Broad gin bottle with an oval label
  { d: 'M318 179 V126 C318 104 324 97 331 93 V72 H328 V64 H352 V72 H349 V93 C356 97 362 104 362 126 V179',
    detail: 'M340 128 C347 128 352 135 352 145 C352 155 347 162 340 162 C333 162 328 155 328 145 C328 135 333 128 340 128' },
  // Wide-bellied decanter with a diamond stopper and liquid line
  { d: 'M412 179 V152 C412 122 426 114 431 110 V88 H427 V80 H453 V88 H449 V110 C454 114 468 122 468 152 V179',
    detail: 'M440 58 L447 70 L440 79 L433 70 Z M416 150 H464' },
  // Coupe glass — bowl, stem, foot
  { d: 'M516 112 H574 C572 130 560 140 545 140 C530 140 518 130 516 112 Z M545 140 V172 M531 179 H559 M545 172 C538 172 533 175 531 179 M545 172 C552 172 557 175 559 179' },
]

export default function CellarShelf() {
  const reduced = useReducedMotion() ?? false

  const draw = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true, amount: 0.45 },
          transition: { duration: 0.9, ease: 'easeInOut' as const, delay },
        }

  return (
    <div className="cellar" aria-hidden="true">
      <svg className="cellar-svg" viewBox="0 0 640 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shelf */}
        <motion.path d="M16 179 H624" stroke={GOLD_SOFT} strokeWidth="1" {...draw(0)} />
        {VESSELS.map((v, i) => (
          <g key={i}>
            <motion.path
              d={v.d}
              stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
              {...draw(0.25 + i * 0.14)}
            />
            {v.detail && (
              <motion.path
                d={v.detail}
                stroke={GOLD_SOFT} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"
                {...draw(0.55 + i * 0.14)}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
