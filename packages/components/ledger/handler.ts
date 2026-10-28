import { DomainError, type Business, type Proposal, type TaskInput } from '../../runtime/src/types';
export function ledger(input: TaskInput, _business: Business): Proposal {
  if (!input.amount) throw new DomainError('Enter the receipt amount.');
  return {
    kind: 'ledger_entry',
    summary: `Record $${input.amount.toFixed(2)} operating expense`,
    details: input.transcript,
    data: { amount: input.amount, category: 'Operating expense', description: input.transcript },
  };
}
