<template>
  <div class="development-history">
    <UiSkeleton v-if="loading" :rows="10" size="lg" />

    <UiEmpty
      v-else-if="error"
      title="开发历程暂时没有同步成功"
      :description="error"
      icon="connection"
      size="lg"
      class="history-empty"
    >
      <template #action>
        <UiButton icon="refresh" @click="$emit('retry')">重新同步</UiButton>
      </template>
    </UiEmpty>

    <UiEmpty
      v-else-if="!history?.available || history.commits.length === 0"
      title="还没有可展示的开发记录"
      description="提交同步后，这里会按时间展示前端与后端的更新。"
      icon="commit"
      size="lg"
      class="history-empty"
    >
      <template #action>
        <UiButton icon="refresh" @click="$emit('retry')">重新同步</UiButton>
      </template>
    </UiEmpty>

    <template v-else>
      <div class="development-summary">
        <section class="history-overview" aria-labelledby="history-overview-title">
          <div class="overview-copy">
            <div class="overview-icon" aria-hidden="true">
              <UiIcon name="commit" />
            </div>
            <div>
              <h2 id="history-overview-title">项目开发历程</h2>
              <p>汇总 Chen404 前端与后端仓库，记录功能、体验与修复的演进。</p>
            </div>
          </div>

          <dl class="history-metrics">
            <div>
              <dt>同步提交</dt>
              <dd>{{ history.totalCommits }}</dd>
            </div>
            <div>
              <dt>贡献者</dt>
              <dd>{{ history.contributorCount }}</dd>
            </div>
            <div>
              <dt>最近更新</dt>
              <dd>{{ latestUpdate }}</dd>
            </div>
          </dl>
        </section>

        <div v-if="history.notice" class="source-notice" :class="{ 'is-stale': history.stale }">
          <UiIcon :name="history.stale ? 'warning' : 'info'" />
          <span>{{ history.notice }}</span>
        </div>

        <ContributionHeatmap :commits="history.commits" embedded />
      </div>

      <section class="commit-section" aria-labelledby="commit-list-title">
        <div class="commit-section-header">
          <div>
            <h2 id="commit-list-title">更新记录</h2>
            <p>{{ filteredCommits.length }} 条记录，按提交时间倒序排列</p>
          </div>

          <div class="category-filter" aria-label="提交类型筛选">
            <button
              v-for="option in categoryOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-active': activeCategory === option.value }"
              :aria-pressed="activeCategory === option.value"
              @click="activeCategory = option.value"
            >
              {{ option.label }}
              <span>{{ option.count }}</span>
            </button>
          </div>
        </div>

        <div v-if="monthGroups.length" class="commit-browser">
          <nav class="month-index" aria-label="按月浏览提交记录">
            <div class="month-index-heading">
              <UiIcon name="calendar" />
              <span>时间索引</span>
              <small>{{ monthGroups.length }} 个月</small>
            </div>

            <ol class="month-index-list">
              <li v-for="group in monthGroups" :key="group.key">
                <button
                  type="button"
                  :class="{ 'is-active': activeMonthKey === group.key }"
                  :aria-current="activeMonthKey === group.key ? 'date' : undefined"
                  @click="selectMonth(group.key)"
                >
                  <span class="month-index-dot" aria-hidden="true" />
                  <span class="month-index-label">{{ group.indexLabel }}</span>
                  <span class="month-index-count">{{ group.commits.length }}</span>
                </button>
              </li>
            </ol>
          </nav>

          <div
            ref="commitMonthsRef"
            class="commit-months"
            role="region"
            :aria-label="selectedMonthGroup ? `${selectedMonthGroup.indexLabel}提交记录` : undefined"
          >
            <Transition name="month-panel" mode="out-in">
              <section
                v-if="selectedMonthGroup"
                :key="selectedMonthGroup.key"
                class="commit-month"
                :aria-labelledby="`commit-month-${selectedMonthGroup.key}`"
              >
                <header class="month-heading">
                  <h3 :id="`commit-month-${selectedMonthGroup.key}`">{{ selectedMonthGroup.label }}</h3>
                  <span>{{ selectedMonthGroup.commits.length }} 次提交</span>
                </header>

                <ol class="commit-list">
                  <li
                    v-for="commit in selectedMonthGroup.commits"
                    :key="`${commit.repository}-${commit.sha}`"
                    class="commit-item"
                  >
                    <span class="timeline-dot" aria-hidden="true" />
                    <time :datetime="commit.committedAt" class="commit-date">{{ formatDate(commit.committedAt, 'MM-DD') }}</time>

                    <div class="commit-content">
                      <div class="commit-badges">
                        <span class="repository-badge">{{ commit.repositoryLabel }}</span>
                        <span class="category-badge" :data-category="categoryFor(commit).value">
                          {{ categoryFor(commit).label }}
                        </span>
                      </div>

                      <a :href="commit.url" target="_blank" rel="noopener noreferrer" class="commit-title">
                        {{ commit.message }}
                        <UiIcon name="external" />
                      </a>

                      <div class="commit-meta">
                        <span class="author-avatar" aria-hidden="true">
                          <img
                            v-if="commit.authorAvatarUrl"
                            :src="commit.authorAvatarUrl"
                            alt=""
                            loading="lazy"
                          />
                          <span v-else>{{ authorInitial(commit) }}</span>
                        </span>
                        <span>{{ commit.authorLogin || commit.authorName || 'GitHub 用户' }}</span>
                        <span class="meta-separator" aria-hidden="true">·</span>
                        <a :href="commit.url" target="_blank" rel="noopener noreferrer" class="commit-sha">
                          {{ commit.shortSha }}
                        </a>
                        <span class="meta-separator" aria-hidden="true">·</span>
                        <span>{{ commit.repository }}</span>
                      </div>
                    </div>
                  </li>
                </ol>
              </section>
            </Transition>
          </div>
        </div>

        <UiEmpty
          v-else
          title="这个分类还没有提交"
          description="选择其他类型，可以继续浏览开发记录。"
          icon="filter"
          size="sm"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { UiButton, UiEmpty, UiIcon, UiSkeleton } from '@/components/ui'
import { formatDate } from '@/utils/format'
import type { DevelopmentCommit, DevelopmentHistory as DevelopmentHistoryData } from '@/types/development-history'
import ContributionHeatmap from './ContributionHeatmap.vue'

type CommitCategory = 'all' | 'feature' | 'experience' | 'fix' | 'content' | 'development'

interface CategoryDefinition {
  value: Exclude<CommitCategory, 'all'>
  label: string
}

const props = defineProps<{
  history: DevelopmentHistoryData | null
  loading: boolean
  error: string
}>()

defineEmits<{
  (event: 'retry'): void
}>()

const activeCategory = ref<CommitCategory>('all')
const activeMonthKey = ref('')
const commitMonthsRef = ref<HTMLElement | null>(null)

const categoryDefinitions: CategoryDefinition[] = [
  { value: 'feature', label: '功能' },
  { value: 'experience', label: '体验' },
  { value: 'fix', label: '修复' },
  { value: 'content', label: '内容' },
  { value: 'development', label: '开发' },
]

const latestUpdate = computed(() => {
  const latest = props.history?.commits[0]?.committedAt
  return latest ? formatDate(latest, 'MM-DD') : '--'
})

const categoryOptions = computed(() => {
  const commits = props.history?.commits || []
  return [
    { value: 'all' as const, label: '全部', count: commits.length },
    ...categoryDefinitions
      .map((definition) => ({
        ...definition,
        count: commits.filter((commit) => categoryFor(commit).value === definition.value).length,
      }))
      .filter((option) => option.count > 0),
  ]
})

const filteredCommits = computed(() => {
  const commits = props.history?.commits || []
  if (activeCategory.value === 'all') return commits
  return commits.filter((commit) => categoryFor(commit).value === activeCategory.value)
})

const monthGroups = computed(() => {
  const groups = new Map<string, { key: string; label: string; indexLabel: string; commits: DevelopmentCommit[] }>()
  filteredCommits.value.forEach((commit) => {
    const date = new Date(commit.committedAt)
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const existing = groups.get(key)
    if (existing) {
      existing.commits.push(commit)
      return
    }
    groups.set(key, {
      key,
      label: `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`,
      indexLabel: `${date.getFullYear()}年${date.getMonth() + 1}月`,
      commits: [commit],
    })
  })
  return Array.from(groups.values())
})

const selectedMonthGroup = computed(() => {
  return monthGroups.value.find((group) => group.key === activeMonthKey.value) || monthGroups.value[0] || null
})

watch(
  monthGroups,
  (groups) => {
    const selectedMonthStillExists = groups.some((group) => group.key === activeMonthKey.value)
    if (!selectedMonthStillExists) activeMonthKey.value = groups[0]?.key || ''
  },
  { immediate: true },
)

function selectMonth(monthKey: string) {
  activeMonthKey.value = monthKey
  nextTick(() => {
    const container = commitMonthsRef.value
    if (!container) return

    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    container.scrollIntoView({ behavior, block: 'start' })
  })
}

function categoryFor(commit: DevelopmentCommit): CategoryDefinition {
  const message = commit.message.toLowerCase()
  if (/fix|修复|修正|bug|错误/.test(message)) {
    return { value: 'fix', label: '修复' }
  }
  if (/docs?|文档|文章|内容|readme/.test(message)) {
    return { value: 'content', label: '内容' }
  }
  if (/perf|优化|体验|样式|界面|ui|交互|响应式|适配/.test(message)) {
    return { value: 'experience', label: '体验' }
  }
  if (/feat|新增|添加|支持|实现|接入|增加/.test(message)) {
    return { value: 'feature', label: '功能' }
  }
  return { value: 'development', label: '开发' }
}

function authorInitial(commit: DevelopmentCommit) {
  return (commit.authorLogin || commit.authorName || 'G').trim().slice(0, 1).toUpperCase()
}
</script>

<style scoped lang="scss">
.development-history {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.history-empty {
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.development-summary {
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.history-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 26px 30px;
}

.overview-copy {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;
}

.overview-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-size: 23px;
}

.overview-copy h2,
.commit-section h2 {
  margin: 0 0 5px;
  color: var(--color-text-primary);
  font-size: 20px;
  line-height: 1.3;
  font-weight: 650;
  text-wrap: balance;
}

.overview-copy p,
.commit-section-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.history-metrics {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  margin: 0;
}

.history-metrics > div {
  min-width: 92px;
  padding: 2px 18px;
  border-left: 1px solid var(--color-border-light);
}

.history-metrics dt {
  margin-bottom: 4px;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.history-metrics dd {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 19px;
  font-weight: 680;
  font-variant-numeric: tabular-nums;
}

.source-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--color-info-soft);
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.development-summary .source-notice {
  margin: 0 30px 18px;
}

.source-notice .ui-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--color-info);
}

.source-notice.is-stale {
  background: var(--color-warning-soft);
}

.source-notice.is-stale .ui-icon {
  color: var(--color-warning);
}

.commit-section {
  padding: 28px 30px 32px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.commit-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.category-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.category-filter button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 11px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard);
}

.category-filter button:hover,
.category-filter button.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.category-filter button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.category-filter button span {
  min-width: 18px;
  padding: 1px 5px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, currentColor 10%, transparent);
  font-size: 10px;
  text-align: center;
}

.commit-browser {
  display: grid;
  grid-template-columns: 172px minmax(0, 1fr);
  align-items: start;
  gap: 32px;
}

.month-index {
  position: sticky;
  top: 96px;
}

.month-index-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 650;
}

.month-index-heading .ui-icon {
  color: var(--color-accent-strong);
  font-size: 17px;
}

.month-index-heading small {
  margin-left: auto;
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 500;
}

.month-index-list {
  position: relative;
  max-height: min(640px, calc(100vh - 180px));
  margin: 0;
  overflow-y: auto;
  padding: 10px 0;
  scrollbar-color: var(--color-border) transparent;
  scrollbar-width: thin;
  list-style: none;
}

.month-index-list::before {
  content: '';
  position: absolute;
  top: 28px;
  bottom: 28px;
  left: 7px;
  width: 1px;
  background: var(--color-border);
}

.month-index-list li {
  position: relative;
}

.month-index-list button {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: color var(--motion-duration-fast) var(--motion-ease-standard);
}

.month-index-list button:hover,
.month-index-list button.is-active {
  color: var(--color-accent-strong);
}

.month-index-list button:focus-visible {
  border-radius: var(--radius-sm);
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.month-index-dot {
  position: relative;
  z-index: 1;
  justify-self: center;
  width: 9px;
  height: 9px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-border);
  box-shadow: 0 0 0 1px var(--color-border);
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-fast) var(--motion-ease-standard);
}

.month-index-list button.is-active .month-index-dot {
  background: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.month-index-label {
  overflow: hidden;
  font-size: 12px;
  font-weight: 560;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-index-count {
  min-width: 27px;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
  font-size: 10px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.month-index-list button.is-active .month-index-count {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.commit-months {
  scroll-margin-top: 112px;
}

.commit-month {
  scroll-margin-top: 112px;
}

.month-panel-enter-active,
.month-panel-leave-active {
  transition:
    opacity var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-entrance);
}

.month-panel-enter-from,
.month-panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.month-heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-light);
}

.month-heading h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 17px;
  font-weight: 650;
}

.month-heading span {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.commit-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.commit-item {
  position: relative;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 14px;
  padding: 12px 10px 18px 18px;
}

.commit-item::before {
  content: '';
  position: absolute;
  top: 23px;
  bottom: -13px;
  left: 4px;
  width: 1px;
  background: var(--color-border);
}

.commit-item:last-child::before {
  display: none;
}

.timeline-dot {
  position: absolute;
  top: 18px;
  left: 0;
  width: 9px;
  height: 9px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 0 2px var(--color-accent-soft);
}

.commit-date {
  padding-top: 2px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.commit-content {
  min-width: 0;
}

.commit-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
}

.repository-badge,
.category-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 600;
}

.repository-badge {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.category-badge {
  background: var(--color-neutral-soft);
  color: var(--color-text-secondary);
}

.category-badge[data-category='fix'] {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.category-badge[data-category='experience'] {
  background: var(--color-info-soft);
  color: var(--color-info);
}

.category-badge[data-category='content'] {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.commit-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 570;
  line-height: 1.55;
  text-decoration: none;
  text-wrap: pretty;
  transition: color var(--motion-duration-fast) var(--motion-ease-standard);
}

.commit-title:hover {
  color: var(--color-accent-strong);
}

.commit-title .ui-icon {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.commit-title:focus-visible,
.commit-sha:focus-visible {
  border-radius: 3px;
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.commit-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.author-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-size: 9px;
  font-weight: 700;
}

.author-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.commit-sha {
  color: var(--color-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  text-decoration: none;
}

.commit-sha:hover {
  color: var(--color-accent-strong);
}

.meta-separator {
  opacity: 0.7;
}

@media (max-width: 860px) {
  .history-overview {
    align-items: flex-start;
    flex-direction: column;
    gap: 22px;
  }

  .history-metrics {
    width: 100%;
  }

  .history-metrics > div {
    flex: 1;
    min-width: 0;
  }

  .history-metrics > div:first-child {
    padding-left: 0;
    border-left: 0;
  }

  .commit-section-header {
    flex-direction: column;
  }

  .category-filter {
    justify-content: flex-start;
  }

  .commit-browser {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .month-index {
    z-index: var(--z-sticky);
    top: 72px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0 12px;
    border-bottom: 1px solid var(--color-border-light);
    background: var(--color-surface);
  }

  .month-index-heading {
    flex: 0 0 auto;
    min-height: 32px;
    padding: 0;
    border: 0;
  }

  .month-index-heading small {
    display: none;
  }

  .month-index-list {
    display: flex;
    gap: 6px;
    max-height: none;
    min-width: 0;
    margin: 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 2px 2px;
    scrollbar-width: none;
  }

  .month-index-list::-webkit-scrollbar {
    display: none;
  }

  .month-index-list::before {
    display: none;
  }

  .month-index-list li {
    flex: 0 0 auto;
  }

  .month-index-list button {
    grid-template-columns: 10px auto auto;
    min-height: 32px;
    padding: 0 10px;
    border-radius: var(--radius-pill);
    background: var(--color-surface-muted);
  }

  .month-index-list button.is-active {
    background: var(--color-accent-soft);
  }

  .month-index-dot {
    width: 7px;
    height: 7px;
    border-width: 1px;
  }

  .commit-months {
    scroll-margin-top: 132px;
  }
}

@media (max-width: 640px) {
  .history-overview,
  .commit-section {
    padding: 22px 18px;
  }

  .overview-copy {
    align-items: flex-start;
  }

  .development-summary .source-notice {
    margin-right: 18px;
    margin-left: 18px;
  }

  .overview-icon {
    flex-basis: 40px;
    width: 40px;
    height: 40px;
  }

  .history-metrics > div {
    padding: 2px 12px;
  }

  .history-metrics dt {
    white-space: nowrap;
  }

  .history-metrics dd {
    font-size: 17px;
  }

  .category-filter {
    flex-wrap: nowrap;
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .category-filter button {
    flex: 0 0 auto;
  }

  .month-index {
    margin: 0 -18px;
    padding-right: 18px;
    padding-left: 18px;
  }

  .month-index-heading span {
    display: none;
  }

  .commit-item {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 8px;
    padding-right: 0;
    padding-left: 16px;
  }

  .commit-title {
    font-size: 14px;
  }

  .commit-meta {
    line-height: 1.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .category-filter button,
  .month-index-list button,
  .month-index-dot,
  .month-panel-enter-active,
  .month-panel-leave-active,
  .commit-title {
    transition: none;
  }
}
</style>
