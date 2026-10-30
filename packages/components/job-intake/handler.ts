import { parseJobRequest } from '../../runtime/src/automation';
import type { Business, Proposal, TaskInput } from '../../runtime/src/types';
export function jobIntake(input: TaskInput, _business: Business): Proposal {
  const facts = parseJobRequest(input);
  return {
    kind: 'create_job',
    summary: facts.urgent
      ? 'Urgent work request · owner attention needed'
      : 'Review a new work request',
    details: `${input.transcript}\n\n${facts.schedulingStatus}${facts.urgent ? '. Potential safety issue: follow your emergency procedure; this is not a diagnosis or dispatch.' : '.'}`,
    data: { ...facts, request: input.transcript },
  };
}
