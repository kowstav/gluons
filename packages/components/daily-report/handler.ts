import type { Business, Proposal, TaskInput } from '../../runtime/src/types';
export function dailyReport(_input: TaskInput, business: Business): Proposal {
  const low = business.stock.filter((s) => s.quantity <= s.threshold);
  return {
    kind: 'daily_report',
    summary: `Daily operations brief · ${business.name}`,
    details: `${business.catalog.length} catalog items are configured. ${low.length} inventory items are at or below threshold${low.length ? ': ' + low.map((s) => s.name).join(', ') : ''}. Review pending actions before closing. Revenue is based only on recorded, approved orders.`,
    data: { lowStockItems: low.map((s) => s.name), catalogItems: business.catalog.length },
  };
}
