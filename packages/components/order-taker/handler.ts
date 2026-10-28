import { DomainError, type Business, type Proposal, type TaskInput } from '../../runtime/src/types';
export function orderTaker(input: TaskInput, business: Business): Proposal {
  const item = business.catalog.find((i) => i.id === input.catalogItemId);
  if (!item || !input.quantity)
    throw new DomainError('Choose a catalog item and quantity before staging an order.');
  const total = Math.round(item.price * input.quantity * 100) / 100;
  return {
    kind: 'create_order',
    summary: `${input.quantity} × ${item.name} · $${total.toFixed(2)}`,
    details: `Record this order at the configured menu price. Customer request: ${input.transcript}`,
    data: { catalogItemId: item.id, quantity: input.quantity, total, item: item.name },
  };
}
