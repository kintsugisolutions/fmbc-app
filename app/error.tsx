'use client'

// Route error boundary. Never surfaces the underlying error to the visitor —
// only a recovery path. `reset()` retries the failed segment; "Go home" is the
// escape hatch. The error object is intentionally not rendered.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="route-error" role="alert">
      <div className="route-error-box">
        <p className="route-error-eyebrow mono">Something went wrong</p>
        <h1 className="route-error-title">This page didn&apos;t load</h1>
        <p className="route-error-sub">
          A temporary hiccup on our end. Your details were not affected.
          Try again, or head back to search.
        </p>
        <div className="route-error-btns">
          <button className="route-error-retry" onClick={() => reset()}>Try again</button>
          <a className="route-error-home" href="/">Go home</a>
        </div>
      </div>
    </div>
  )
}
