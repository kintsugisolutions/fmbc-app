// Split out from actions.ts: a 'use server' file may only export async functions,
// so this plain constant can't live alongside approveProduct/rejectProduct/markQueueSeen.
export const CATEGORY_OPTIONS = [
  'Whisky',
  'Gin',
  'Vodka',
  'Rum',
  'Beer',
  'Brandy',
  'Tequila',
  'Wine',
  'Cocktail',
] as const
