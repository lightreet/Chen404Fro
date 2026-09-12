import assert from 'node:assert/strict'
import test from 'node:test'
import { loadTypeScriptModule } from './helpers/load-typescript.mjs'

const { parseLrcDocument, currentLyricIndex, formatMusicTime } = loadTypeScriptModule(new URL('../src/modules/music/presentation.ts', import.meta.url))

test('all music surfaces share sorted lyrics and expand repeated timestamps', () => {
  const parsed = parseLrcDocument('[ar:Artist]\n[01:20.125]Later\n  [00:01.5][00:12.03]Repeated\n\ninvalid\n[00:999]invalid timestamp\n[00:05]  ')
  assert.equal(parsed.metadataCount, 1)
  assert.equal(parsed.invalidCount, 3)
  assert.deepEqual(Array.from(parsed.lines, line => [line.time, line.text, line.timeLabel]), [[1.5, 'Repeated', '00:01.50'], [12.03, 'Repeated', '00:12.03'], [80.125, 'Later', '01:20.12']])
  assert.equal(new Set(parsed.lines.map(line => line.key)).size, 3)
  assert.equal(currentLyricIndex(parsed.lines, 0), 0)
  assert.equal(currentLyricIndex(parsed.lines, 12.03), 1)
  assert.equal(currentLyricIndex(parsed.lines, 500), 2)
  assert.equal(currentLyricIndex([], 0), -1)
})

test('time display preserves mobile and desktop formats and handles invalid values', () => {
  assert.equal(formatMusicTime(65.99), '01:05')
  assert.equal(formatMusicTime(65.99, { padMinutes: false }), '1:05')
  assert.equal(formatMusicTime(6000), '100:00')
  for (const value of [-1, NaN, Infinity]) {
    assert.equal(formatMusicTime(value), '00:00')
    assert.equal(formatMusicTime(value, { padMinutes: false }), '0:00')
  }
})
