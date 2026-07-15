<template>
  <section class="heatmap-section" :class="{ 'is-embedded': embedded }" aria-labelledby="contribution-title">
    <div class="section-heading">
      <div>
        <h2 id="contribution-title">提交热力图</h2>
        <p>近半年在前端与后端仓库留下的开发节奏</p>
      </div>
      <span class="period-label">近 28 周</span>
    </div>

    <div class="heatmap-scroll" tabindex="0" aria-label="提交热力图，可横向滚动查看">
      <div class="heatmap-chart">
        <div class="month-row" aria-hidden="true">
          <span class="month-spacer" />
          <span
            v-for="week in weeks"
            :key="week.index"
            class="month-label"
          >{{ week.monthLabel }}</span>
        </div>

        <div class="heatmap-body">
          <div class="weekday-labels" aria-hidden="true">
            <span />
            <span>一</span>
            <span />
            <span>三</span>
            <span />
            <span>五</span>
            <span />
          </div>

          <div class="day-grid">
            <span
              v-for="day in days"
              :key="day.key"
              class="day-cell"
              :class="{ 'is-future': day.future }"
              :data-level="day.level"
              :title="day.title"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="heatmap-footer">
      <span>{{ activeDays }} 个活跃日</span>
      <div class="legend" aria-label="提交数量图例">
        <span>少</span>
        <i v-for="level in [0, 1, 2, 3, 4]" :key="level" :data-level="level" />
        <span>多</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DevelopmentCommit } from '@/types/development-history'

const WEEK_COUNT = 28
const DAYS_PER_WEEK = 7

const props = defineProps<{
  commits: DevelopmentCommit[]
  embedded?: boolean
}>()

interface HeatmapDay {
  key: string
  level: number
  future: boolean
  title: string
}

interface HeatmapWeek {
  index: number
  monthLabel: string
}

const contributionCounts = computed(() => {
  const counts = new Map<string, number>()
  props.commits.forEach((commit) => {
    const date = new Date(commit.committedAt)
    if (Number.isNaN(date.getTime())) return
    const key = toDateKey(date)
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return counts
})

const chartRange = computed(() => {
  const today = startOfDay(new Date())
  const end = new Date(today)
  end.setDate(end.getDate() + (DAYS_PER_WEEK - 1 - end.getDay()))
  const start = new Date(end)
  start.setDate(start.getDate() - WEEK_COUNT * DAYS_PER_WEEK + 1)
  return { start, today }
})

const days = computed<HeatmapDay[]>(() => {
  const { start, today } = chartRange.value
  return Array.from({ length: WEEK_COUNT * DAYS_PER_WEEK }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = toDateKey(date)
    const count = contributionCounts.value.get(key) || 0
    const future = date.getTime() > today.getTime()
    return {
      key,
      level: future ? -1 : resolveLevel(count),
      future,
      title: future ? `${formatDisplayDate(date)}，尚未到来` : `${formatDisplayDate(date)}，${count} 次提交`,
    }
  })
})

const weeks = computed<HeatmapWeek[]>(() => {
  const start = chartRange.value.start
  let previousMonth = -1
  return Array.from({ length: WEEK_COUNT }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index * DAYS_PER_WEEK)
    const month = date.getMonth()
    const monthLabel = month !== previousMonth && date.getDate() <= 7 ? `${month + 1}月` : ''
    previousMonth = month
    return { index, monthLabel }
  })
})

const activeDays = computed(() => days.value.filter((day) => !day.future && day.level > 0).length)

function resolveLevel(count: number) {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped lang="scss">
.heatmap-section {
  padding: 28px 30px 22px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.heatmap-section.is-embedded {
  border-top: 1px solid var(--color-border-light);
  border-radius: 0;
  background: transparent;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.section-heading h2 {
  margin: 0 0 6px;
  color: var(--color-text-primary);
  font-size: 20px;
  line-height: 1.3;
  font-weight: 650;
  text-wrap: balance;
}

.section-heading p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.period-label {
  flex: 0 0 auto;
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  font-size: 12px;
  font-weight: 600;
}

.heatmap-scroll {
  container-type: inline-size;
  overflow-x: auto;
  padding: 2px 0 8px;
  outline: none;
}

.heatmap-scroll:focus-visible {
  border-radius: var(--radius-sm);
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.heatmap-chart {
  --heatmap-cell-size: 14px;
  --heatmap-cell-size: clamp(14px, 3cqw, 36px);

  min-width: 560px;
  width: max-content;
  margin-inline: auto;
}

.month-row {
  display: grid;
  grid-template-columns: 30px repeat(28, var(--heatmap-cell-size));
  column-gap: 4px;
  height: 20px;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.month-label {
  white-space: nowrap;
}

.heatmap-body {
  display: flex;
  gap: 4px;
}

.weekday-labels {
  display: grid;
  grid-template-rows: repeat(7, var(--heatmap-cell-size));
  row-gap: 4px;
  width: 30px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: var(--heatmap-cell-size);
}

.day-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, var(--heatmap-cell-size));
  grid-auto-columns: var(--heatmap-cell-size);
  gap: 4px;
}

.day-cell,
.legend i {
  display: block;
  border-radius: 3px;
  background: var(--color-surface-muted);
}

.day-cell {
  width: var(--heatmap-cell-size);
  height: var(--heatmap-cell-size);
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-entrance),
    background-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.day-cell:hover {
  transform: scale(1.22);
  outline: 2px solid var(--color-surface);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.day-cell.is-future {
  opacity: 0.28;
}

.day-cell[data-level='1'],
.legend i[data-level='1'] {
  background: color-mix(in srgb, var(--primary) 30%, var(--color-surface));
}

.day-cell[data-level='2'],
.legend i[data-level='2'] {
  background: color-mix(in srgb, var(--primary) 52%, var(--color-surface));
}

.day-cell[data-level='3'],
.legend i[data-level='3'] {
  background: color-mix(in srgb, var(--primary) 76%, var(--color-surface));
}

.day-cell[data-level='4'],
.legend i[data-level='4'] {
  background: var(--primary-dark);
}

.heatmap-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 12px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend i {
  width: 11px;
  height: 11px;
  border-radius: 2px;
}

@media (max-width: 640px) {
  .heatmap-section {
    padding: 22px 18px 18px;
  }

  .section-heading {
    margin-bottom: 18px;
  }

  .section-heading p {
    max-width: 24ch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .day-cell {
    transition: none;
  }

  .day-cell:hover {
    transform: none;
  }
}
</style>
