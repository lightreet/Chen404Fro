export interface DevelopmentCommit {
  sha: string
  shortSha: string
  repository: string
  repositoryLabel: string
  message: string
  authorName?: string | null
  authorLogin?: string | null
  authorAvatarUrl?: string | null
  committedAt: string
  url: string
}

export interface DevelopmentRepository {
  name: string
  label: string
  commitCount: number
  source: 'api' | 'atom'
  url: string
}

export interface DevelopmentHistory {
  commits: DevelopmentCommit[]
  repositories: DevelopmentRepository[]
  totalCommits: number
  contributorCount: number
  generatedAt: string
  available: boolean
  stale: boolean
  notice?: string | null
}

export interface GitHubDevelopmentAdminConfig {
  owner: string
  repositories: string[]
  branch: string
  token?: string
  tokenConfigured?: boolean
  tokenPreview?: string
  clearToken?: boolean
  cacheMinutes: number
  apiCommitLimit: number
  requestTimeoutSeconds: number
  apiBaseUrl: string
  webBaseUrl: string
}
