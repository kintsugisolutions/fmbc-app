import Image from 'next/image'

// Brand splash shown on first load, above the age gate (z-index 10000). It holds
// for a beat, fills a thin progress bar, then fades to reveal the gate beneath.
// Pure CSS — auto-hides via animation even without JS, and is server-rendered so
// there's no flash. Hidden for returning verified visitors (CSS in globals.css),
// keeping their fast path instant. Does not touch any age-gate logic.
export default function BootLoader() {
  return (
    <div className="boot-loader" aria-hidden="true">
      <div className="boot-loader-mark">
        <Image src="/fmbc_icon.png" alt="" width={52} height={52} priority />
      </div>
      <p className="boot-loader-text mono">Find My Bottle Club</p>
      <div className="boot-loader-bar" />
    </div>
  )
}
