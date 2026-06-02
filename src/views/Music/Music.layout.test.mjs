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
