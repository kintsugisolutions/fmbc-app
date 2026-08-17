// Classifies a store's free-text WhatsApp reply into an availability status.
//
// ─── Why this is its own carefully-tested module ─────────────────────────────
// The previous inline version checked `reply.includes('available')` BEFORE
// checking for negatives. "available" is a substring of "not available" — the
// most natural way a shopkeeper says no in English — so every "no, not
// available" was classified as Available. That wrote a false confirmed-
// availability signal into the demand data AND WhatsApp'd the searcher that
// the bottle was in stock at a named licensed retailer. Never let a positive
// substring win over a negation.
//
// Design rules, in priority order:
//   1. Match whole tokens, never substrings. ("unavailable" must not match
//      the positive token "available".)
//   2. An explicit negation phrase wins outright.
//   3. If BOTH positive and negative signals are present and it isn't a clear
//      negation phrase, return 'Replied' — a human decides. Guessing wrong is
//      worse than not guessing.
//   4. Anything not confidently understood returns 'Replied' too.
//
// Ludhiana stores reply in English, Hinglish (roman-script Hindi/Punjabi), and
// occasionally Gurmukhi/Devanagari script — all three are handled below.
// ─────────────────────────────────────────────────────────────────────────────

export type ReplyStatus = 'Available' | 'Not Available' | 'Replied'

// Keep letters/digits from ASCII, Devanagari (U+0900–097F) and Gurmukhi
// (U+0A00–0A7F); everything else (punctuation, emoji, newlines) becomes a
// space so tokens split cleanly. Deliberately avoids unicode property escapes
// (\p{L}) since tsconfig targets es5 and the /u flag isn't available there.
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ਀-੿]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Multi-word negations. Checked as substrings of the normalised string, and
// they win outright — these are unambiguous even when a positive word appears
// inside them ("not available", "available nahi hai").
const NEGATIVE_PHRASES = [
  'not available', 'not avail', 'no available', 'nt available',
  'not in stock', 'no stock', 'out of stock', 'stock out', 'stock over',
  'stock nahi', 'stock nhi', 'stock khatam', 'stock khtm',
  'nahi hai', 'nhi hai', 'nahi h', 'nhi h', 'nahi mil', 'nhi mil',
  'nahi hoga', 'nhi hoga', 'nahi milega', 'nhi milega',
  'sold out', 'no longer', 'no more', 'not there', 'not have',
  'dont have', 'do not have', 'doesnt have', 'does not have',
  'over ho', 'khatam ho', 'finish ho',
]

// Single-word negatives, matched as whole tokens only.
const NEGATIVE_TOKENS = new Set([
  '2', 'no', 'nope', 'nah', 'nahi', 'nhi', 'nai', 'na', 'naa',
  'out', 'over', 'khatam', 'khtm', 'unavailable', 'sold',
  'finish', 'finished', 'nil', 'none', 'never',
  'नहीं', 'नही', 'ਨਹੀਂ', 'ਨਹੀ',
])

// Multi-word positives, matched as substrings.
const POSITIVE_PHRASES = [
  'in stock', 'stock hai', 'stock h', 'stock me', 'stock mein',
  'available hai', 'available h', 'available hai ji',
  'mil jayega', 'mil jaega', 'mil jayega',
  'we have', 'have it', 'is available', 'yes available',
  'haan ji', 'han ji', 'ha ji',
]

// Single-word positives, matched as whole tokens only. Deliberately
// conservative — bare "ok"/"ya"/"stock" are excluded because they're
// acknowledgements or ambiguous rather than confirmations, and routing those
// to 'Replied' for a human is the safer failure.
const POSITIVE_TOKENS = new Set([
  '1', 'yes', 'yeah', 'yep', 'yup', 'yess',
  'haan', 'han', 'hanji', 'available', 'instock',
  'hai', 'hain', 'milega', 'confirm', 'confirmed',
  'हाँ', 'हां', 'है', 'ਹਾਂ', 'ਹੈ',
])

/**
 * Classify a raw WhatsApp reply from a venue.
 *
 * Returns 'Replied' (i.e. "a human needs to look at this") whenever the intent
 * is not unambiguous — including when positive and negative signals both
 * appear, e.g. "no problem, available hai". That is intentional: a wrong
 * 'Available' is a false stock claim attributed to a named retailer, which is
 * far more costly than an unclassified reply sitting in the queue.
 */
export function classifyVenueReply(rawText: string): ReplyStatus {
  const normalised = normalise(rawText)
  if (!normalised) return 'Replied'

  // Whole-message numeric codes, matching the "1 = Yes, 2 = No" convention
  // the outbound template asks stores to use.
  if (normalised === '1') return 'Available'
  if (normalised === '2') return 'Not Available'

  // Rule 2: an explicit negation phrase wins outright, even though several of
  // these contain a positive word inside them.
  if (NEGATIVE_PHRASES.some((phrase) => normalised.includes(phrase))) {
    return 'Not Available'
  }

  const tokens = normalised.split(' ')
  const hasNegative = tokens.some((t) => NEGATIVE_TOKENS.has(t))
  const hasPositive =
    POSITIVE_PHRASES.some((phrase) => normalised.includes(phrase)) ||
    tokens.some((t) => POSITIVE_TOKENS.has(t))

  if (hasNegative && !hasPositive) return 'Not Available'
  if (hasPositive && !hasNegative) return 'Available'

  // Rule 3 & 4: mixed signals, or no recognised signal at all → human review.
  return 'Replied'
}
