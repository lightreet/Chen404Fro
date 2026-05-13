import test from 'node:test';
import assert from 'node:assert/strict';

import { toPreciseId } from './preciseId.ts';

test('preserves 19-digit article ids exactly', () => {
  const id = '2049168046718734337';

  assert.equal(toPreciseId(id), id);
});

test('does not collapse long ids to JavaScript unsafe integers', () => {
  const id = '2049168046718734337';

  assert.notEqual(String(Number(id)), toPreciseId(id));
});
