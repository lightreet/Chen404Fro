export interface CategoryIconSearchResult {
  value: string
  prefix: string
  name: string
  collectionName: string
}

interface IconifySearchResponse {
  icons?: string[]
  collections?: Record<string, { name?: string }>
}

const ICONIFY_SEARCH_URL = 'https://api.iconify.design/search'
const MDI_PREFIX_PRIORITY = ['mdi', 'mdi-light']

function splitIconName(value: string) {
  const [prefix = '', ...rest] = value.split(':')
  return {
    prefix,
    name: rest.join(':'),
  }
}

function getPrefixRank(prefix: string) {
  const rank = MDI_PREFIX_PRIORITY.indexOf(prefix)
  return rank === -1 ? MDI_PREFIX_PRIORITY.length : rank
}

export async function searchCategoryIcons(
  keyword: string,
  signal?: AbortSignal,
): Promise<CategoryIconSearchResult[]> {
  const query = keyword.trim()
  if (!query) {
    return []
  }

  const response = await fetch(
    `${ICONIFY_SEARCH_URL}?query=${encodeURIComponent(query)}&limit=32`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`Iconify search failed: ${response.status}`)
  }

  const payload = (await response.json()) as IconifySearchResponse
  const collections = payload.collections ?? {}

  return (payload.icons ?? [])
    .map((value) => {
      const { prefix, name } = splitIconName(value)
      return {
        value,
        prefix,
        name,
        collectionName: collections[prefix]?.name || prefix,
      }
    })
    .sort((left, right) => {
      const prefixRankDiff = getPrefixRank(left.prefix) - getPrefixRank(right.prefix)
      if (prefixRankDiff !== 0) return prefixRankDiff

      const prefixDiff = left.prefix.localeCompare(right.prefix)
      if (prefixDiff !== 0) return prefixDiff

      return left.name.localeCompare(right.name)
    })
}
