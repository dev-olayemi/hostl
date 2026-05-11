/**
 * Shared handle utilities — safe to import in both client and server code.
 */

/** Validate handle: letters, numbers, underscores, hyphens only. 2–30 chars. */
export function isValidHandle(handle: string): boolean {
  return /^[a-zA-Z0-9_-]{2,30}$/.test(handle)
}

/** Generate handle suggestions from first + last name */
export function generateHandleSuggestions(first: string, last: string): string[] {
  const f = first.toLowerCase().replace(/[^a-z0-9]/g, '')
  const l = last.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!f) return []
  const suggestions = new Set<string>()
  if (f && l) {
    suggestions.add(`${f}_${l}`)
    suggestions.add(`${f}-${l}`)
    suggestions.add(`${f}${l}`)
    suggestions.add(`${f[0]}_${l}`)
  }
  suggestions.add(f)
  return Array.from(suggestions).slice(0, 4)
}
