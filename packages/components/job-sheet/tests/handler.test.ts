import test from 'node:test';
import assert from 'node:assert/strict';
import { jobSheet } from '../handler';
import { seedBusiness, scenarioInput } from '../../../runtime/src/seed';
test('job summary does not claim payroll or savings', () => {
  const p = jobSheet(scenarioInput('job-sheet'), seedBusiness);
  assert.equal(p.data.minutes, 45);
  assert.match(p.details, /not time saved or payroll/);
});
