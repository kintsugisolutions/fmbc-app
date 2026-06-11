import Image from 'next/image'

// Full-screen route loading state. Dark field, the FMBC mark breathing on a slow
// pulse, and a quiet status line. Kept minimal — it appears for a beat during
// navigation, so it should feel like the page settling, not a spinner.
export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <div className="route-loading-mark">
        <Image src="/fmbc_icon.png" alt="" width={48} height={48} priority />
      </div>
      <p className="route-loading-text mono">Finding your bottle</p>
    </div>
  )
}
