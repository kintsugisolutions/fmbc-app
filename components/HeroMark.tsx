'use client'
import { useRef, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

// The foil "Marker Bottle" mark below the hero headline — inlined (not an <img>)
// so the cap can animate independently: click it and the cap pops off with a
// synthesized cork-pop sound, a short fizz burst, then settles back down ready
// to be popped again. Gradients/paths mirror public/fmbc-mark-foil.svg exactly;
// this is the only place that SVG needs to be interactive, so the source of
// truth for the *static* mark stays the public file everywhere else references.

let audioCtx: AudioContext | null = null

function playPopSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx ??= new Ctx()
    const ctx = audioCtx
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    // The "pop": a short pitch-dropping tone burst, like a cork leaving a neck.
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.09)
    oscGain.gain.setValueAtTime(0.0001, now)
    oscGain.gain.exponentialRampToValueAtTime(0.5, now + 0.008)
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)
    osc.connect(oscGain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.12)

    // A thin noise burst layered under it for the "fizz" of the release.
    const bufferSize = Math.floor(ctx.sampleRate * 0.15)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 2000
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.15, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination)
    noise.start(now)
  } catch {
    // Web Audio unavailable or blocked — the visual pop still plays on its own.
  }
}

const capVariants: Variants = {
  rest: { y: 0, rotate: 0, opacity: 1 },
  pop: {
    y: [0, -22, -10, 0],
    rotate: [0, -18, 10, 0],
    opacity: [1, 1, 1, 1],
    transition: { duration: 0.62, times: [0, 0.35, 0.7, 1], ease: 'easeOut' },
  },
}

const fizzVariants: Variants = {
  rest: { opacity: 0, y: 0, scale: 0.6 },
  pop: (i: number) => ({
    opacity: [0, 1, 0],
    y: [0, -(20 + i * 8)],
    x: [(i - 1) * 5, (i - 1) * 12],
    scale: [0.6, 1, 0.4],
    transition: { duration: 0.55, delay: 0.05 + i * 0.03, ease: 'easeOut' },
  }),
}

export default function HeroMark() {
  const reduced = useReducedMotion() ?? false
  const [popKey, setPopKey] = useState(0)
  const controlsRef = useRef<HTMLButtonElement>(null)

  function handleClick() {
    if (!reduced) playPopSound()
    setPopKey(k => k + 1)
  }

  return (
    <button
      ref={controlsRef}
      type="button"
      className="hero-mark-btn"
      onClick={handleClick}
      aria-label="Find My Bottle Club"
    >
      <motion.svg
        width={72}
        height={101}
        viewBox="0 0 120 168"
        className="hero-mark"
        whileTap={reduced ? undefined : { scale: 0.94 }}
        transition={{ duration: 0.12 }}
      >
        <defs>
          <linearGradient id="heroMarkFoil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F4DFA0" />
            <stop offset="0.28" stopColor="#D2A74F" />
            <stop offset="0.55" stopColor="#9C742A" />
            <stop offset="0.78" stopColor="#D8B05C" />
            <stop offset="1" stopColor="#8A6524" />
          </linearGradient>
          <linearGradient id="heroMarkSheen" x1="0" y1="0" x2="1" y2="0.25">
            <stop offset="0" stopColor="#FFF3CF" stopOpacity="0.9" />
            <stop offset="0.45" stopColor="#FFF3CF" stopOpacity="0" />
          </linearGradient>
          <filter id="heroMarkEmboss" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.55" />
          </filter>
        </defs>

        <g filter="url(#heroMarkEmboss)">
          <motion.rect
            key={`cap-${popKey}`}
            x="49" y="7" width="22" height="8" rx="3"
            fill="url(#heroMarkFoil)"
            style={{ transformOrigin: '60px 11px' }}
            variants={reduced ? undefined : capVariants}
            initial="rest"
            animate={reduced ? undefined : 'pop'}
          />
          <path
            fillRule="evenodd"
            d="M54 17 L54 56 C50 61 26 66 26 90 C26 116 48 132 60 160 C72 132 94 116 94 90 C94 66 70 61 66 56 L66 17 Z M60 75.5 A14.5 14.5 0 1 1 60 104.5 A14.5 14.5 0 1 1 60 75.5 Z"
            fill="url(#heroMarkFoil)"
          />
        </g>
        <path
          fillRule="evenodd"
          d="M54 17 L54 56 C50 61 26 66 26 90 C26 116 48 132 60 160 C72 132 94 116 94 90 C94 66 70 61 66 56 L66 17 Z M60 75.5 A14.5 14.5 0 1 1 60 104.5 A14.5 14.5 0 1 1 60 75.5 Z"
          fill="url(#heroMarkSheen)"
          opacity="0.55"
        />
        <path d="M52 60 C43 64 30 70 30 90 C30 104 37 114 46 124 C38 113 33 103 33 91 C33 71 47 65 52 60 Z" fill="#FFF3CF" opacity="0.35" />
        <path d="M56 18 L56 54 L57.5 54 L57.5 18 Z" fill="#FFF3CF" opacity="0.3" />
        <circle cx="60" cy="90" r="14.5" fill="none" stroke="#6E5017" strokeWidth="1.4" opacity="0.8" />
        <circle cx="60" cy="89" r="13.2" fill="none" stroke="#F4DFA0" strokeWidth="0.8" opacity="0.35" />

        {/* Fizz burst from the neck, in sync with the cap pop */}
        {!reduced && [0, 1, 2, 3].map(i => (
          <motion.circle
            key={`fizz-${popKey}-${i}`}
            cx={60} cy={14} r={1.6 - i * 0.15}
            fill="#FFF3CF"
            custom={i}
            variants={fizzVariants}
            initial="rest"
            animate="pop"
          />
        ))}
      </motion.svg>
    </button>
  )
}
