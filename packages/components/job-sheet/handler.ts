import { summarizeJobSheet } from '../../runtime/src/automation';
import type { Business, Proposal, TaskInput } from '../../runtime/src/types';
export function jobSheet(input: TaskInput, _business: Business): Proposal {
  const facts = summarizeJobSheet(input.transcript);
  return {
    kind: 'job_sheet',
    summary: `${facts.completed} completed jobs · review the work summary`,
    details: `${facts.rows} imported jobs: ${facts.completed} completed and ${facts.pending} pending. Recorded completed-job duration: ${facts.minutes} minutes. This describes the uploaded sheet, not time saved or payroll due.`,
    data: facts,
  };
}
