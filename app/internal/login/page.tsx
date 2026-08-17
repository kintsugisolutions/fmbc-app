import { loginAction } from './actions'

// Passphrase gate for /internal — no username, single shared secret
// (INTERNAL_DASHBOARD_SECRET). This page itself is excluded from the
// middleware's auth check (see middleware.ts) so it's always reachable.
const ERROR_MESSAGES: Record<string, string> = {
  '1': 'Wrong passphrase — try again.',
  rate: 'Too many attempts. Wait 15 minutes and try again.',
  config: 'Login is unavailable: server is missing required configuration. Check Vercel env vars.',
}

export default function InternalLoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessage = searchParams?.error
    ? ERROR_MESSAGES[searchParams.error] ?? ERROR_MESSAGES['1']
    : null

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#12130f',
        color: '#e8e2d4',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <form
        action={loginAction}
        style={{
          background: '#1c1d18',
          border: '1px solid #33342b',
          borderRadius: 8,
          padding: 32,
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 16, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>
          FMBC Internal
        </h1>
        <input
          type="password"
          name="passphrase"
          placeholder="Passphrase"
          autoFocus
          required
          style={{
            background: '#12130f',
            border: '1px solid #33342b',
            borderRadius: 4,
            color: '#e8e2d4',
            padding: '10px 12px',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        />
        {errorMessage && (
          <p style={{ color: '#e08585', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{errorMessage}</p>
        )}
        <button
          type="submit"
          style={{
            background: '#c9a24b',
            border: 'none',
            borderRadius: 4,
            color: '#12130f',
            fontWeight: 600,
            padding: '10px 12px',
            fontSize: 13,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Enter
        </button>
      </form>
    </div>
  )
}
