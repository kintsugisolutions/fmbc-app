'use client'
import { useEffect, useState } from 'react'

// iOS Safari has no native install prompt (no beforeinstallprompt event),
// so we show a one-time dismissible sheet explaining Share → Add to Home Screen.
// Rules: iOS Safari only · not already installed · not previously dismissed ·
// only after age verification · appears 3s after eligibility.

const DISMISS_KEY = 'fmbc-ios-prompt-dismissed'

function isIos(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iphone|ipad|ipod/.test(ua) || iPadOs
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari-specific flag
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export default function IosInstallPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    function maybeShow() {
      try {
        if (!isIos() || isStandalone()) return
        if (localStorage.getItem(DISMISS_KEY)) return
        timer = setTimeout(() => setShow(true), 3000)
      } catch { /* storage blocked — skip quietly */ }
    }

    if (document.documentElement.hasAttribute('data-fmbc-verified')) {
      maybeShow()
    } else {
      window.addEventListener('fmbc:verified', maybeShow, { once: true })
    }

    return () => {
      window.removeEventListener('fmbc:verified', maybeShow)
      if (timer) clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="ios-prompt" role="dialog" aria-label="Add FMBC to your Home Screen">
      <button className="ios-prompt-close" onClick={dismiss} aria-label="Dismiss">×</button>
      <p className="ios-prompt-eyebrow mono">Faster access</p>
      <p className="ios-prompt-title">Keep FMBC on your Home Screen</p>
      <p className="ios-prompt-steps">
        Tap{' '}
        <svg className="ios-share-icon" width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Share">
          <path d="M7.5 1v11M7.5 1L4 4.5M7.5 1L11 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 8v7.5A1.5 1.5 0 003.5 17h8a1.5 1.5 0 001.5-1.5V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>{' '}
        <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
        Opens like an app — straight to search.
      </p>
      <button className="ios-prompt-dismiss mono" onClick={dismiss}>Got it</button>
    </div>
  )
}
