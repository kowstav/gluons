import test from 'node:test';
import assert from 'node:assert/strict';
import { jobIntake } from '../handler';
import { seedBusiness, scenarioInput } from '../../../runtime/src/seed';
test('job intake keeps time suggestions unconfirmed', () => {
  const p = jobIntake(scenarioInput('job-intake'), seedBusiness);
  assert.equal(p.kind, 'create_job');
  assert.match(p.details, /Unconfirmed/);
});
