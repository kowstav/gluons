import test from 'node:test';
import assert from 'node:assert/strict';
import { customerService } from '../handler';
import { seedBusiness, scenarioInput } from '../../../runtime/src/seed';
test('support replies use configured hours and defer sensitive requests to the owner', () => {
  const input = scenarioInput('customer-service');
  assert.match(customerService(input, seedBusiness).details, /Mon–Sat/);
  assert.match(
    customerService({ ...input, transcript: 'I need a refund' }, seedBusiness).details,
    /owner/,
  );
  assert.equal(
    customerService({ ...input, to: '+12025550123' }, seedBusiness).data.to,
    '+12025550123',
  );
});
