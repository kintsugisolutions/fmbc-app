#!/usr/bin/env bash
# ─── FMBC command ────────────────────────────────────────────────────────────
# One word to run everything. Source this from ~/.zshrc:
#
#   source "$HOME/Documents/FMBC Assets/fmbc-app/scripts/fmbc.sh"
#
# Then, from any directory:
#   fmbc              start the local dev server and open the browser
#   fmbc deploy "msg" commit + push everything (Vercel auto-deploys on push)
#   fmbc check        typecheck without building
#   fmbc build        full production build (catches what typecheck misses)
#   fmbc dash         open the live internal dashboard
#   fmbc local-dash   open the internal dashboard on localhost
#   fmbc unlock       clear stale git lock files
#   fmbc pull         pull latest from GitHub
#   fmbc status       git status + current branch
#   fmbc help         this list
# ─────────────────────────────────────────────────────────────────────────────

FMBC_DIR="$HOME/Documents/FMBC Assets/fmbc-app"

fmbc() {
  local cmd="${1:-dev}"
  shift 2>/dev/null

  if [ ! -d "$FMBC_DIR" ]; then
    echo "✗ Can't find the project at: $FMBC_DIR"
    echo "  Edit FMBC_DIR at the top of scripts/fmbc.sh if you moved it."
    return 1
  fi

  cd "$FMBC_DIR" || return 1

  case "$cmd" in
    dev|"")
      # Stale git locks block every later command, and they're the single most
      # common papercut in this project — clear them on every start.
      _fmbc_unlock_quiet

      if [ ! -d node_modules ]; then
        echo "→ Installing dependencies (first run)..."
        npm install || return 1
      fi

      echo "→ Starting FMBC on http://localhost:3000"
      echo "  Public site      http://localhost:3000"
      echo "  Internal dash    http://localhost:3000/internal/login"
      echo "  Press Ctrl+C to stop."
      echo ""

      # Open the browser once the server is actually answering, rather than
      # immediately (which lands on a connection-refused page).
      (
        for _ in $(seq 1 40); do
          if curl -s -o /dev/null http://localhost:3000; then
            open http://localhost:3000
            break
          fi
          sleep 0.5
        done
      ) &

      npm run dev
      ;;

    deploy|push)
      _fmbc_unlock_quiet

      local msg="$1"
      if [ -z "$msg" ]; then
        echo "✗ Needs a commit message:  fmbc deploy \"what changed\""
        return 1
      fi

      echo "→ Changes to be deployed:"
      echo ""
      git status --short
      echo ""

      # Belt and braces: .env* is gitignored, but a secret reaching GitHub is
      # unrecoverable, so refuse outright rather than trust the ignore file.
      if git status --porcelain | grep -qE '\.env(\.|$)'; then
        echo "✗ An .env file is showing up as a change. Refusing to commit."
        echo "  Check .gitignore before continuing — secrets must never be pushed."
        return 1
      fi

      printf "Commit and push all of the above? [y/N] "
      read -r reply
      case "$reply" in
        [yY]*) ;;
        *) echo "Cancelled — nothing committed."; return 0 ;;
      esac

      git add -A || return 1
      git commit -m "$msg" || return 1

      echo "→ Pushing..."
      if git push; then
        echo ""
        echo "✓ Pushed. Vercel is building now:"
        echo "  https://vercel.com/fmbc/fmbc-app/deployments"
      else
        echo ""
        echo "✗ Push failed. Committed locally, so nothing is lost — fix the"
        echo "  error above and run:  fmbc push-only"
        return 1
      fi
      ;;

    push-only)
      _fmbc_unlock_quiet
      git push && echo "✓ Pushed."
      ;;

    check|typecheck)
      echo "→ Typechecking..."
      if npx tsc --noEmit; then
        echo "✓ No type errors."
      else
        return 1
      fi
      ;;

    build)
      _fmbc_unlock_quiet
      echo "→ Production build (this is what Vercel runs)..."
      npm run build
      ;;

    dash|dashboard)
      open "https://www.findmybottle.club/internal/dashboard"
      ;;

    local-dash)
      open "http://localhost:3000/internal/login"
      ;;

    unlock)
      _fmbc_unlock_quiet
      echo "✓ Cleared any stale git lock files."
      ;;

    pull)
      _fmbc_unlock_quiet
      git pull
      ;;

    status|st)
      echo "→ Branch: $(git rev-parse --abbrev-ref HEAD)"
      git status --short
      ;;

    help|-h|--help)
      cat <<'USAGE'
fmbc              start the dev server + open the browser
fmbc deploy "msg" commit + push everything (Vercel deploys automatically)
fmbc check        typecheck only, no build
fmbc build        full production build
fmbc dash         open the LIVE internal dashboard
fmbc local-dash   open the internal dashboard on localhost
fmbc status       what's changed, and which branch
fmbc pull         pull latest from GitHub
fmbc unlock       clear stale git lock files
USAGE
      ;;

    *)
      echo "✗ Unknown command: $cmd"
      echo "  Run 'fmbc help' to see what's available."
      return 1
      ;;
  esac
}

# Removes the .git lock files that get left behind when a git process is
# interrupted. Harmless when they don't exist.
_fmbc_unlock_quiet() {
  rm -f "$FMBC_DIR/.git/index.lock" "$FMBC_DIR/.git/HEAD.lock" 2>/dev/null
}
