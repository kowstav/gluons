import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyReport } from '../handler';
import { seedBusiness, scenarioInput } from '../../../runtime/src/seed';
test('daily report summarizes real configured stock instead of inventing revenue', () => {
  const p = dailyReport(scenarioInput('daily-report'), seedBusiness);
  assert.deepEqual(p.data.lowStockItems, ['Burger buns', 'Potatoes']);
  assert.equal(p.data.catalogItems, 4);
  assert.match(p.details, /recorded, approved orders/);
});
