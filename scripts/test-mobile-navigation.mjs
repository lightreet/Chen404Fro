import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/modules/mobile/navigation.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { normalizeMobileNavigation, buildMobileNavigation, isMobilePrimaryPage } = context.exports;
const normalize = value => Array.from(normalizeMobileNavigation(value));

test('invalid saved preferences fall back; an intentional empty list keeps only fixed entries', () => {
  for (const value of [null, undefined, '', {}, 3]) assert.deepEqual(normalize(value), ['bookshelf', 'music', 'travel']);
  assert.deepEqual(Array.from(buildMobileNavigation([]), item => item.key), ['home', 'discover']);
});
test('unknown paths, administrative destinations, duplicates and fixed entries cannot enter custom slots', () => {
  assert.deepEqual(normalize(['home', '/admin', 'javascript:alert(1)', 'music', 'music', 12, 'profile', 'discover', 'about', 'archive']), ['music', 'profile', 'about']);
});
test('custom navigation preserves the chosen order and pins both ends', () => {
  assert.deepEqual(Array.from(buildMobileNavigation(['guestbook', 'profile', 'archive']), item => item.path), ['/', '/guestbook', '/profile', '/archive', '/discover']);
});
test('only primary destinations retain the bottom bar; detail states always hide it', () => {
  assert.equal(isMobilePrimaryPage('/profile', ['profile']), true);
  assert.equal(isMobilePrimaryPage('/about', []), false);
  assert.equal(isMobilePrimaryPage('/music/tracks/new', ['music']), false);
  assert.equal(isMobilePrimaryPage('/memory-map', [], true), false);
  assert.equal(isMobilePrimaryPage('/music', ['music'], true), false);
  assert.equal(isMobilePrimaryPage('/profile', ['profile'], true), false);
  assert.equal(isMobilePrimaryPage('/bookshelf', []), true);
});
