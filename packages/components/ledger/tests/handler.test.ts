import test from 'node:test';
import assert from 'node:assert/strict';
import { ledger } from '../handler';
import { seedBusiness, scenarioInput } from '../../../runtime/src/seed';
test('receipt requires a known amount before staging an expense', () => {
  assert.equal(ledger(scenarioInput('ledger'), seedBusiness).data.amount, 48.5);
  assert.throws(
    () => ledger({ ...scenarioInput('ledger'), amount: undefined }, seedBusiness),
    /amount/,
  );
});
