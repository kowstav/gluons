import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSeed,
  decideAction,
  DemoProvider,
  executeLocal,
  processTask,
  scenarioInput,
  savings,
  seedBusiness,
  validateProposal,
  type ModelProvider,
} from '../src/index';
async function fixture() {
  const state = await createSeed();
  state.tasks = [];
  state.actions = [];
  state.audit = [];
  return state;
}
test('routine tasks use the cheap model and always wait for human approval', async () => {
  const s = await fixture();
  const t = await processTask(s, scenarioInput('order-taker'), new DemoProvider());
  assert.equal(t.attempts[0].tier, 'cheap');
  assert.equal(t.decision.needsHuman, false);
  assert.equal(s.actions[0].status, 'pending');
  assert.throws(() => executeLocal(s, s.actions[0].id), /approve/);
  assert.equal(s.effects.length, 0);
});
test('hard and moderate tasks select the appropriate model tier', async () => {
  const s = await fixture();
  const hard = await processTask(
    s,
    {
      ...scenarioInput('customer-service'),
      transcript: 'A serious allergy complaint needs your attention.',
    },
    new DemoProvider(),
  );
  assert.equal(hard.attempts[0].tier, 'frontier');
  assert.equal(hard.decision.needsHuman, true);
  const medium = await processTask(
    s,
    { ...scenarioInput('order-taker'), transcript: 'Please change my combo order.' },
    new DemoProvider(),
  );
  assert.equal(medium.attempts[0].tier, 'medium');
});
test('invalid cheap output escalates and includes every attempt in total cost', async () => {
  const s = await fixture();
  const t = await processTask(
    s,
    { ...scenarioInput('order-taker'), forceEscalation: true },
    new DemoProvider(),
  );
  assert.equal(t.escalated, true);
  assert.equal(t.attempts.length, 2);
  assert.equal(t.attempts[0].valid, false);
  assert.equal(t.attempts[1].tier, 'medium');
  assert.equal(t.status, 'staged');
  assert.equal(t.costUsd, t.decision.costUsd + t.attempts.reduce((sum, a) => sum + a.costUsd, 0));
});
test('all failed output checks produce a failed task without an action', async () => {
  const s = await fixture();
  const provider = new DemoProvider();
  provider.generate = async (tier, input, business) => {
    const r = await new DemoProvider().generate(tier, input, business);
    return { ...r, proposal: { ...r.proposal, summary: '' } };
  };
  const t = await processTask(s, scenarioInput('order-taker'), provider);
  assert.equal(t.status, 'failed');
  assert.equal(t.attempts.length, 3);
  assert.equal(s.actions.length, 0);
});
test('approved trial actions create no operation, stock mutation or external effect', async () => {
  const s = await fixture();
  const original = structuredClone(s.businesses[0].stock);
  await processTask(s, scenarioInput('order-taker'), new DemoProvider());
  const a = s.actions[0];
  decideAction(s, a.id, 'approve', 'owner@example.test');
  executeLocal(s, a.id);
  assert.equal(a.status, 'simulated');
  assert.equal(s.effects.length, 0);
  assert.deepEqual(s.businesses[0].stock, original);
  assert.equal(a.approvedBy, 'owner@example.test');
});
test('live actions execute once and deduct trusted ingredient stock', async () => {
  const s = await fixture();
  s.businesses[0].mode = 'live';
  await processTask(s, scenarioInput('order-taker'), new DemoProvider());
  const a = s.actions[0];
  decideAction(s, a.id, 'approve', 'owner');
  executeLocal(s, a.id);
  executeLocal(s, a.id);
  assert.equal(a.status, 'executed');
  assert.equal(s.effects.length, 1);
  assert.equal(s.businesses[0].stock.find((i) => i.id === 'buns')!.quantity, 16);
});
test('pending action retains trial mode even if business switches to live', async () => {
  const s = await fixture();
  await processTask(s, scenarioInput('order-taker'), new DemoProvider());
  s.businesses[0].mode = 'live';
  decideAction(s, s.actions[0].id, 'approve', 'owner');
  assert.equal(executeLocal(s, s.actions[0].id).status, 'simulated');
});
test('rejections cannot execute or be approved again', async () => {
  const s = await fixture();
  await processTask(s, scenarioInput('ledger'), new DemoProvider());
  const a = s.actions[0];
  decideAction(s, a.id, 'reject', 'owner');
  assert.throws(() => executeLocal(s, a.id), /approve/);
  assert.throws(() => decideAction(s, a.id, 'approve', 'owner'), /already been reviewed/);
  assert.equal(s.effects.length, 0);
});
test('edited proposal retains the original content and reviewer identity', async () => {
  const s = await fixture();
  await processTask(s, scenarioInput('customer-service'), new DemoProvider());
  const a = s.actions[0];
  const before = a.details;
  decideAction(s, a.id, 'approve', 'owner', {
    summary: 'Owner reviewed reply',
    details: 'We are open until 9 pm. Thank you for checking!',
  });
  assert.equal(a.original?.details, before);
  assert.equal(a.edited, true);
  assert.equal(a.approvedBy, 'owner');
  assert.equal(a.details, 'We are open until 9 pm. Thank you for checking!');
});
test('duplicate inbound event IDs do not create duplicate tasks or actions', async () => {
  const s = await fixture();
  const input = { ...scenarioInput('order-taker'), eventId: 'twilio:SM123' };
  const a = await processTask(s, input, new DemoProvider());
  const b = await processTask(s, input, new DemoProvider());
  assert.equal(a.id, b.id);
  assert.equal(s.tasks.length, 1);
  assert.equal(s.actions.length, 1);
});
test('disabled components, unsupported triggers and invalid business IDs fail closed', async () => {
  const s = await fixture();
  s.integrations[0].componentIds = ['ledger'];
  await assert.rejects(
    () => processTask(s, scenarioInput('order-taker'), new DemoProvider()),
    /not enabled/,
  );
  await assert.rejects(
    () => processTask(s, { ...scenarioInput('ledger'), trigger: 'phone_call' }, new DemoProvider()),
    /not supported/,
  );
  await assert.rejects(
    () => processTask(s, { ...scenarioInput('ledger'), businessId: 'unknown' }, new DemoProvider()),
    /not found/,
  );
});
test('model output cannot invent a price, recipient or executable argument', async () => {
  const s = await fixture();
  const input = scenarioInput('order-taker');
  const result = await new DemoProvider().generate('cheap', input, s.businesses[0]);
  assert.throws(
    () =>
      validateProposal(
        { ...result.proposal, data: { ...result.proposal.data, total: 0.01 } },
        input,
        s.businesses[0],
      ),
    /total/,
  );
  const safe = validateProposal(
    { ...result.proposal, data: { ...result.proposal.data, executeNow: true } },
    input,
    s.businesses[0],
  );
  assert.equal(safe.data.executeNow, undefined);
});
test('insufficient stock fails all checks and changed stock is checked at execution', async () => {
  const s = await fixture();
  const input = { ...scenarioInput('order-taker'), quantity: 30 };
  const task = await processTask(s, input, new DemoProvider());
  assert.equal(task.status, 'failed');
  assert.equal(s.actions.length, 0);
  await processTask(s, scenarioInput('order-taker'), new DemoProvider());
  const a = s.actions[0];
  a.mode = 'live';
  s.businesses[0].stock[0].quantity = 0;
  decideAction(s, a.id, 'approve', 'owner');
  assert.throws(() => executeLocal(s, a.id), /Stock changed/);
  assert.equal(s.effects.length, 0);
});
test('savings exclude pending and rejected gross time, subtract all review time, include failed AI costs', async () => {
  const s = await fixture();
  await processTask(s, scenarioInput('order-taker'), new DemoProvider());
  await processTask(s, scenarioInput('ledger'), new DemoProvider());
  decideAction(s, s.actions[1].id, 'approve', 'owner');
  executeLocal(s, s.actions[1].id);
  decideAction(s, s.actions[0].id, 'reject', 'owner');
  const result = savings(s, s.businesses[0].id);
  assert.equal(result.grossHours, 4 / 60);
  assert.equal(result.reviewHours, 1 / 60);
  assert.equal(result.hours, 3 / 60);
  assert.equal(result.completed, 1);
  assert.equal(result.approvalRate, 50);
  assert.equal(
    result.aiCost,
    s.tasks.reduce((sum, t) => sum + t.costUsd, 0),
  );
  assert.equal(result.estimated, true);
});
test('live WhatsApp cannot bypass the delivery adapter', async () => {
  const s = await fixture();
  s.businesses[0].mode = 'live';
  await processTask(s, scenarioInput('customer-service'), new DemoProvider());
  decideAction(s, s.actions[0].id, 'approve', 'owner');
  assert.throws(() => executeLocal(s, s.actions[0].id), /external execution adapter/);
  assert.equal(s.effects.length, 0);
});
test('owner quantity edits reprice the order and retain original executable data', async () => {
  const s = await fixture();
  await processTask(s, scenarioInput('order-taker'), new DemoProvider());
  const a = s.actions[0];
  decideAction(s, a.id, 'approve', 'owner', {
    summary: a.summary,
    details: 'Three burgers for pickup, reviewed by owner.',
    quantity: 3,
  });
  assert.equal(a.data.quantity, 3);
  assert.equal(a.data.total, 28.5);
  assert.equal(a.original?.data.quantity, 2);
  assert.match(a.summary, /28.50/);
});
test('unavailable decision service fails closed and leaves a visible audit record', async () => {
  const s = await fixture();
  const p = new DemoProvider();
  p.decide = async () => {
    throw new Error('Unavailable');
  };
  const t = await processTask(s, scenarioInput('ledger'), p);
  assert.equal(t.status, 'failed');
  assert.equal(t.model, 'unavailable');
  assert.equal(s.actions.length, 0);
  assert.equal(s.audit[0].type, 'task_failed');
});
test('provider failures are logged as unknown usage before escalation', async () => {
  const s = await fixture();
  const p = new DemoProvider();
  p.generate = async (tier, input, business) => {
    if (tier === 'cheap') throw new Error('Timeout');
    return new DemoProvider().generate(tier, input, business);
  };
  const t = await processTask(s, scenarioInput('ledger'), p);
  assert.equal(t.status, 'staged');
  assert.equal(t.escalated, true);
  assert.equal(t.attempts[0].usageKnown, false);
  assert.equal(t.attempts[0].valid, false);
  assert.equal(t.attempts[1].tier, 'medium');
});
