import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const musicViewSource = readFileSync(path.join(currentDir, 'Music.vue'), 'utf8');

test('keeps the card view pagination inside a full-height board content wrapper', () => {
  assert.match(
    musicViewSource,
    /<div class="category-track-board__content">[\s\S]*<div class="category-track-board__view category-track-board__view--cards">[\s\S]*class="music-card-pagination"/,
  );
});

test('keeps the list view pagination in a stretchable column layout', () => {
  assert.match(
    musicViewSource,
    /<div[^>]*class="category-track-board__view category-track-board__view--rows">[\s\S]*class="category-track-table"[\s\S]*class="music-list-pagination"/,
  );
});

test('defines layout rules that let the pagination stay pinned to the bottom edge', () => {
  assert.match(
    musicViewSource,
    /\.category-track-board__content\s*\{[\s\S]*display:\s*flex;[\s\S]*flex:\s*1 1 auto;[\s\S]*flex-direction:\s*column;[\s\S]*\}/,
  );
  assert.match(
    musicViewSource,
    /\.music-card-pagination,\s*\.music-list-pagination\s*\{[\s\S]*margin-top:\s*auto;[\s\S]*\}/,
  );
});

test('keeps the radio panel content centered in balanced columns', () => {
  assert.match(
    musicViewSource,
    /\.radio-panel\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(320px,\s*520px\)\);[\s\S]*justify-content:\s*center;/,
  );
  assert.match(
    musicViewSource,
    /\.radio-panel__visual\s*\{[\s\S]*width:\s*min\(100%,\s*520px\);[\s\S]*justify-self:\s*center;/,
  );
  assert.match(
    musicViewSource,
    /\.radio-panel__body\s*\{[\s\S]*width:\s*min\(100%,\s*520px\);[\s\S]*justify-self:\s*center;/,
  );
});

test('keeps card and row tracks draggable for quick categorization', () => {
  assert.match(
    musicViewSource,
    /class="music-track-card"[\s\S]*:draggable="canManage"[\s\S]*@dragstart="handleTrackDragStart\(\$event, track\)"/,
  );
  assert.match(
    musicViewSource,
    /class="category-track-row"[\s\S]*:draggable="canManage"[\s\S]*@dragstart="handleTrackDragStart\(\$event, track\)"/,
  );
});

test('keeps playlist categories as managed drop targets', () => {
  assert.match(
    musicViewSource,
    /class="playlist-category-card"[\s\S]*@dragover="handleCategoryDragOver\(\$event, playlist\)"[\s\S]*@drop="handleCategoryDrop\(\$event, playlist\)"/,
  );
  assert.match(
    musicViewSource,
    /\.playlist-category-card\.is-drag-over\s*\{/,
  );
});

test('saves category track changes without reloading the whole music page', () => {
  const persistMatch = musicViewSource.match(/async function persistCategoryTracks[\s\S]*?function replaceAdminPlaylist/);
  assert.ok(persistMatch);
  assert.doesNotMatch(persistMatch[0], /loadMusic\(/);
  assert.match(persistMatch[0], /replaceAdminPlaylist\(saved\)[\s\S]*syncCurrentPlaylist\(saved\)/);
});
