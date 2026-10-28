import test from 'node:test';
import assert from 'node:assert/strict';
import { phoneAgent } from '../handler';
import { seedBusiness, scenarioInput } from '../../../runtime/src/seed';
test('phone intake proposes an order when a known catalog item is supplied', () => {
  assert.equal(phoneAgent(scenarioInput('phone-agent'), seedBusiness).kind, 'create_order');
  assert.equal(
    phoneAgent({ ...scenarioInput('phone-agent'), catalogItemId: undefined }, seedBusiness).kind,
    'send_reply',
  );
});
