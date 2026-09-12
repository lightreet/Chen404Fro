import type { MusicPlayMode } from '@/stores/music-player'

export const PLAY_MODES: Record<MusicPlayMode, { label: string; icon: string }> = {
  sequence: { label: '顺序播放', icon: 'sequence-play' },
  shuffle: { label: '随机播放', icon: 'shuffle' },
  single: { label: '单曲循环', icon: 'repeat-one' },
}

export interface TimedLyricLine {
  key: string
  time: number
  timeLabel: string
  text: string
  current: boolean
}

export interface LrcParseResult {
  lines: TimedLyricLine[]
  metadataCount: number
  invalidCount: number
}

const TIMESTAMP_PATTERN = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?]/g
const TIMED_LINE_PATTERN = /^((?:\[\d{1,2}:\d{2}(?:\.\d{1,3})?])+)(.*)$/

/** 播放页与编辑器共用解析规则，重复时间标签拆成多行并按时间排序。 */
export function parseLrcDocument(input: string): LrcParseResult {
  const result: LrcParseResult = { lines: [], metadataCount: 0, invalidCount: 0 }
  input.split('\n').forEach((raw, index) => {
    const line = raw.trim()
    if (!line) return
    if (/^\[[a-zA-Z]+:.*]$/.test(line)) { result.metadataCount++; return }
    const match = line.match(TIMED_LINE_PATTERN)
    const text = match?.[2]?.trim()
    if (!match || !text) { result.invalidCount++; return }
    Array.from(match[1].matchAll(TIMESTAMP_PATTERN)).forEach((stamp, stampIndex) => {
      const milliseconds = Number((stamp[3] || '0').padEnd(3, '0'))
      const time = Number(stamp[1]) * 60 + Number(stamp[2]) + milliseconds / 1000
      result.lines.push({
        key: `lrc-${index}-${stampIndex}`,
        time,
        timeLabel: `${formatMusicTime(time)}.${String(Math.floor(milliseconds / 10)).padStart(2, '0')}`,
        text,
        current: false,
      })
    })
  })
  result.lines.sort((left, right) => left.time - right.time)
  return result
}

export function parseLrcLines(input: string): TimedLyricLine[] {
  return parseLrcDocument(input).lines
}

/** 返回按时间排序的歌词中当前行；首句开始前保持首句可见。 */
export function currentLyricIndex(lines: ReadonlyArray<{ time?: number }>, time: number): number {
  if (!lines.length) return -1
  let low = 0, high = lines.length - 1, current = 0
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if ((lines[mid].time ?? 0) <= time) { current = mid; low = mid + 1 }
    else high = mid - 1
  }
  return current
}

export function formatMusicTime(value: number, options: { padMinutes?: boolean } = {}): string {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  const minutes = String(Math.floor(seconds / 60))
  return `${options.padMinutes === false ? minutes : minutes.padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
