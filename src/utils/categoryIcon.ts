export const DEFAULT_CATEGORY_ICON = 'mdi:folder-open'

/**
 * Normalize user-provided Iconify names while keeping remote icon support open.
 * Empty values are treated as "use default icon"; non-empty values are preserved
 * so preview/render layers can decide whether to fall back after a failed load.
 */
export function normalizeCategoryIcon(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase()
}

export function getCategoryIconOrFallback(
  raw: string | null | undefined,
  fallback: string = DEFAULT_CATEGORY_ICON,
): string {
  const normalized = normalizeCategoryIcon(raw)
  return normalized || fallback
}
