import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totalCents, validAmounts } from '../src/report.js';

test('currency uses integer cents without floating point rounding', () => {
  assert.equal(totalCents([10, 20, 1250]), 1280);
  assert.equal(totalCents(Array(1000).fill(1_000_000_000)), 1_000_000_000_000);
});
test('rejects malformed, oversized, fractional, negative and unsafe input', () => {
  for (const value of [null, {}, [], ['1'], [-1], [0.5], [Infinity], [Number.MAX_SAFE_INTEGER], Array(1001).fill(1)]) {
    assert.equal(validAmounts(value), false);
    assert.throws(() => totalCents(value));
  }
});
