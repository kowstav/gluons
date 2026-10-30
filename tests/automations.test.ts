import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSeed,
  seedBusiness,
  DemoProvider,
  runWorkflow,
  receiptAmount,
  stockCandidates,
  summarizeJobSheet,
  parseJobRequest,
  businessAnswer,
  decideAction,
  executeLocal,
} from '../packages/runtime/src/index';
test('receipt extraction rejects ambiguous totals and unsupported currencies', () => {
  assert.equal(
    receiptAmount('Invoice\nSubtotal: USD 40.00\nTax: USD 8.50\nTotal: USD 48.50'),
    48.5,
  );
  assert.throws(() => receiptAmount('Total: USD 12.00\nTotal: USD 48.50'));
  assert.throws(() => receiptAmount('Total: EUR 48.50'));
  assert.throws(() => receiptAmount('Subtotal: USD 48.50'));
});
test('Papa Parse and JSON Rules Engine use configured IDs and thresholds, reject duplicates', async () => {
  const tasks = await stockCandidates('id,quantity\nbuns,24\npatties,21', seedBusiness);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].stockItemId, 'buns');
  await assert.rejects(stockCandidates('id,quantity\nbuns,2\nbuns,3', seedBusiness));
  await assert.rejects(stockCandidates('id,quantity\nunknown,2', seedBusiness));
  await assert.rejects(stockCandidates('id,quantity\nbuns,-2', seedBusiness));
});
test('job sheets summarize observed minutes without treating them as time saved', () => {
  assert.deepEqual(summarizeJobSheet('job,minutes,status\nA,45,completed\nB,20,pending'), {
    rows: 2,
    completed: 1,
    pending: 1,
    minutes: 45,
  });
  assert.throws(() => summarizeJobSheet('job,minutes,status\nA,40,done'));
  assert.throws(() => summarizeJobSheet('job,minutes,status\nA,40,completed\nA,20,pending'));
});
test('Chrono interprets requested times in an explicit offset and never confirms bookings', () => {
  const facts = parseJobRequest({
    businessId: 'b',
    componentId: 'job-intake',
    trigger: 'manual',
    transcript: 'Visit tomorrow at 10 am',
    referenceTime: '2026-10-30T08:00:00.000Z',
    timezoneOffsetMinutes: 330,
  });
  assert.equal(facts.requestedAt, '2026-10-31T04:30:00.000Z');
  assert.match(facts.schedulingStatus, /Unconfirmed/);
  assert.equal(
    parseJobRequest({
      businessId: 'b',
      componentId: 'job-intake',
      trigger: 'manual',
      transcript: 'There is a gas leak',
      referenceTime: '2026-10-30T08:00:00.000Z',
    }).urgent,
    true,
  );
});
test('Fuse retrieval uses configured facts and falls back rather than inventing policy', () => {
  assert.match(businessAnswer('When do you close?', seedBusiness), /Mon–Sat/);
  assert.match(businessAnswer('Refund please', seedBusiness), /owner/);
  assert.match(businessAnswer('Can you ship internationally?', seedBusiness), /owner/);
});
test('workflows retain approval, trial isolation, source provenance, replay safety and disabled-service checks', async () => {
  const state = await createSeed();
  state.tasks = [];
  state.actions = [];
  state.effects = [];
  const payload = {
    businessId: seedBusiness.id,
    workflow: 'receipt',
    text: 'Invoice\nTotal: USD 48.50',
    eventId: 'receipt-1',
  };
  const result = await runWorkflow(state, payload, new DemoProvider());
  assert.equal(result.tasks[0].preparation?.sourceSha256.length, 64);
  assert.equal(state.actions[0].status, 'pending');
  assert.throws(() => executeLocal(state, state.actions[0].id));
  await runWorkflow(state, payload, new DemoProvider());
  assert.equal(state.actions.length, 1);
  await assert.rejects(
    runWorkflow(state, { ...payload, text: 'Invoice\nTotal: USD 88.00' }, new DemoProvider()),
    /different source text/,
  );
  decideAction(state, state.actions[0].id, 'approve', 'owner');
  executeLocal(state, state.actions[0].id);
  assert.equal(state.actions[0].status, 'simulated');
  assert.equal(state.effects.length, 0);
  await assert.rejects(
    runWorkflow(
      state,
      { ...payload, workflow: 'job_request', eventId: 'job-1' },
      new DemoProvider(),
    ),
    /Enable/,
  );
  state.integrations[0].componentIds.push('job-intake');
  const job = await runWorkflow(
    state,
    { ...payload, workflow: 'job_request', text: 'Visit tomorrow at 10 am', eventId: 'job-2' },
    new DemoProvider(),
  );
  assert.equal(job.tasks[0].status, 'staged');
  assert.equal(state.actions[0].kind, 'create_job');
  assert.equal(state.actions[0].status, 'pending');
});
