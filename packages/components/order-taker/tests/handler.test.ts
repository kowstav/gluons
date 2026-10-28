import test from 'node:test';
import assert from 'node:assert/strict';
import { orderTaker } from '../handler';
import { seedBusiness, scenarioInput } from '../../../runtime/src/seed';
test('order total uses the configured catalog price', () => {
  const p = orderTaker(scenarioInput('order-taker'), seedBusiness);
  assert.equal(p.data.total, 19);
  assert.equal(p.data.quantity, 2);
  assert.throws(
    () => orderTaker({ ...scenarioInput('order-taker'), catalogItemId: 'fake' }, seedBusiness),
    /catalog/,
  );
});
