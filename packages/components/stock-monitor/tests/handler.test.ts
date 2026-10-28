import test from 'node:test';
import assert from 'node:assert/strict';
import { stockMonitor } from '../handler';
import { seedBusiness, scenarioInput } from '../../../runtime/src/seed';
test('stock alert respects the configured threshold and does not purchase stock', () => {
  const p = stockMonitor(scenarioInput('stock-monitor'), seedBusiness);
  assert.equal(p.kind, 'stock_alert');
  assert.equal(p.data.threshold, 24);
  assert.throws(
    () => stockMonitor({ ...scenarioInput('stock-monitor'), stockQuantity: 25 }, seedBusiness),
    /above/,
  );
});
