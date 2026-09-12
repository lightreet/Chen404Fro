export const creationSections = [
  { value: 'articles', label: '文章', title: '我的文章', icon: 'article', unit: '篇' },
  { value: 'travel', label: '旅行', title: '我的旅行', icon: 'location', unit: '篇' },
  { value: 'music', label: '音乐', title: '我的音乐', icon: 'music', unit: '首' },
] as const

export type CreationKind = typeof creationSections[number]['value']

export function resolveCreationKind(value: unknown): CreationKind {
  return value === 'travel' || value === 'music' ? value : 'articles'
}
