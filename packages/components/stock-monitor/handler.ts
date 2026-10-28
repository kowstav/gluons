import { DomainError, type Business, type Proposal, type TaskInput } from '../../runtime/src/types';
export function stockMonitor(input: TaskInput, business: Business): Proposal {
  const item =
    business.stock.find((i) => i.id === input.stockItemId) ??
    business.stock.find((i) => i.quantity <= i.threshold);
  if (!item) throw new DomainError('No low-stock item found. Select an inventory item.');
  const quantity = input.stockQuantity ?? item.quantity;
  if (quantity > item.threshold)
    throw new DomainError(`${item.name} is above its alert threshold.`);
  return {
    kind: 'stock_alert',
    summary: `${item.name} is running low`,
    details: `${quantity} ${item.unit} available; alert threshold is ${item.threshold} ${item.unit}. Review stock before the next peak period. This alert does not place a supplier order.`,
    data: { stockItemId: item.id, quantity, threshold: item.threshold },
  };
}
