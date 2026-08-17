// Split out from actions.ts: a 'use server' file may only export async functions,
// so this plain constant can't live alongside approveProduct/rejectProduct/markQueueSeen.
//
// Expanded 2026-08-17 beyond the original 9 categories — "Soju" and similar
// searches were falling outside every existing bucket, forcing a bad choice
// between mis-categorizing them or leaving them stuck in the review queue.
// This list covers the major retail spirit/beverage families (see sources
// below) plus a catch-all "Others" so nothing is ever forced into the wrong
// bucket. Categories here are presentation/filtering only — products.category
// is a free-text column with no DB-level enum constraint, so adding more
// later (e.g. if a specific regional spirit starts trending) is just an edit
// to this file, no migration required.
export const CATEGORY_OPTIONS = [
  'Whisky',
  'Vodka',
  'Rum',
  'Gin',
  'Brandy',
  'Tequila',
  'Mezcal',
  'Liqueur',
  'Wine',
  'Champagne & Sparkling',
  'Beer',
  'Cider',
  'Soju',
  'Sake',
  'Cocktail & RTD',
  'Others',
] as const
