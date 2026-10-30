import { components, models, tokenCost } from './catalog';
import { handlers } from './handlers';
import { DemoProvider } from './demo';
import type { Business, ComponentId, WorkspaceState, TaskInput, ProposedAction } from './types';
export const seedBusiness: Business = {
  id: 'business-morning-table',
  name: 'The Morning Table',
  ownerName: 'Alex Morgan',
  sectorPackId: 'food-vendor',
  mode: 'trial',
  currency: 'USD',
  phone: '+12025550142',
  hours: 'Mon–Sat, 8 am–9 pm',
  createdAt: '2026-10-01T08:00:00.000Z',
  baseline: { monthlyStaffCost: 3200, monthlyStaffHours: 208, reviewMinutesPerTask: 0.5 },
  catalog: [
    {
      id: 'classic-burger',
      name: 'Classic burger',
      price: 9.5,
      ingredients: { buns: 1, patties: 1 },
    },
    { id: 'veggie-wrap', name: 'Veggie wrap', price: 7, ingredients: { wraps: 1 } },
    {
      id: 'burger-combo',
      name: 'Burger + fries combo',
      price: 12.5,
      ingredients: { buns: 1, patties: 1, potatoes: 0.25 },
    },
    { id: 'cold-brew', name: 'Cold brew', price: 4.5 },
  ],
  stock: [
    { id: 'buns', name: 'Burger buns', quantity: 18, threshold: 24, unit: 'pieces' },
    { id: 'patties', name: 'Burger patties', quantity: 60, threshold: 20, unit: 'pieces' },
    { id: 'wraps', name: 'Tortilla wraps', quantity: 40, threshold: 15, unit: 'pieces' },
    { id: 'potatoes', name: 'Potatoes', quantity: 8, threshold: 10, unit: 'kg' },
  ],
};
export function scenarioInput(
  componentId: ComponentId,
  business: Business = seedBusiness,
): TaskInput {
  const base = { businessId: business.id, componentId, trigger: 'manual' as const };
  switch (componentId) {
    case 'order-taker':
      return {
        ...base,
        transcript: 'Two classic burgers for pickup at 12:30, please.',
        catalogItemId: business.catalog[0]?.id,
        quantity: 2,
      };
    case 'phone-agent':
      return {
        ...base,
        trigger: 'phone_call',
        transcript: 'Hi, can I order a burger for pickup?',
        catalogItemId: business.catalog[0]?.id,
        quantity: 1,
      };
    case 'stock-monitor':
      return {
        ...base,
        trigger: 'scheduled_check',
        transcript: 'Check ingredient inventory before the lunch rush.',
        stockItemId: business.stock[0]?.id,
        stockQuantity: Math.min(
          business.stock[0]?.quantity ?? 0,
          business.stock[0]?.threshold ?? 0,
        ),
      };
    case 'ledger':
      return {
        ...base,
        trigger: 'receipt',
        transcript: 'Fresh produce delivery from the local supplier.',
        amount: 48.5,
      };
    case 'customer-service':
      return {
        ...base,
        trigger: 'whatsapp_message',
        transcript: 'Hello! What time do you close today?',
      };
    case 'job-intake':
      return {
        ...base,
        transcript:
          'Please visit tomorrow at 10 am to inspect the leaking tap. Confirm availability first.',
        referenceTime: '2026-10-30T08:00:00.000Z',
        timezoneOffsetMinutes: 0,
      };
    case 'job-sheet':
      return {
        ...base,
        transcript: 'job,minutes,status\nvisit-101,45,completed\nvisit-102,30,pending',
      };
    default:
      return {
        ...base,
        trigger: 'daily_schedule',
        transcript: 'Prepare the end-of-day operations summary.',
      };
  }
}
export async function createSeed(): Promise<WorkspaceState> {
  const business = structuredClone(seedBusiness);
  business.createdAt = new Date(Date.now() - 18 * 86400000).toISOString();
  const state: WorkspaceState = {
    revision: 0,
    businesses: [business],
    integrations: [
      {
        id: 'integration-morning-table',
        businessId: business.id,
        sectorPackId: business.sectorPackId,
        componentIds: components
          .filter((c) => c.id !== 'job-intake' && c.id !== 'job-sheet')
          .map((c) => c.id),
        versions: Object.fromEntries(
          components
            .filter((c) => c.id !== 'job-intake' && c.id !== 'job-sheet')
            .map((c) => [c.id, c.version]),
        ),
        status: 'active',
        createdAt: business.createdAt,
      },
    ],
    tasks: [],
    actions: [],
    audit: [],
    effects: [],
    bookings: [],
  };
  const demo = new DemoProvider();
  for (let i = 0; i < 432; i++) {
    const historical = components.filter((c) => c.id !== 'job-intake' && c.id !== 'job-sheet');
    const component = historical[i % historical.length];
    const input = scenarioInput(component.id, business);
    const decision = await demo.decide(input);
    const tier = i % 17 === 0 ? 'frontier' : i % 9 === 0 ? 'medium' : 'cheap';
    const at = new Date(Date.now() - (432 - i) * 60 * 60 * 1000).toISOString();
    const proposal = handlers[component.id](input, business);
    const rejected = i % 23 === 0;
    const pending = i >= 427;
    const action: ProposedAction = {
      ...proposal,
      id: `seed-action-${i}`,
      taskId: `seed-task-${i}`,
      businessId: business.id,
      status: pending ? 'pending' : rejected ? 'rejected' : 'simulated',
      risk: component.actions[0].risk,
      mode: 'trial',
      createdAt: at,
      approvedBy: pending ? undefined : 'Alex Morgan · demo',
      decidedAt: pending ? undefined : at,
      executedAt: pending || rejected ? undefined : at,
      edited: false,
      result: pending
        ? undefined
        : rejected
          ? 'Owner rejected this sample proposal.'
          : 'Synthetic trial history; no real operation was performed.',
    };
    state.actions.unshift(action);
    const cost = tokenCost(tier, 950, 260);
    state.tasks.unshift({
      id: action.taskId,
      businessId: business.id,
      componentId: component.id,
      trigger: input.trigger,
      input: input.transcript,
      createdAt: at,
      status: 'staged',
      decision: {
        ...decision,
        difficulty: tier === 'frontier' ? 'hard' : tier === 'medium' ? 'moderate' : 'easy',
      },
      attempts: [
        {
          tier,
          model: models[tier].id,
          inputTokens: 950,
          outputTokens: 260,
          costUsd: cost,
          valid: true,
          costEstimated: true,
        },
      ],
      model: models[tier].id,
      costUsd: cost + decision.costUsd,
      durationMs: tier === 'cheap' ? 240 : 1360,
      escalated: false,
      humanMinutes: component.human_minutes_per_task,
      provider: 'demo',
    });
  }
  state.audit.push({
    id: 'seed-created',
    at: new Date().toISOString(),
    businessId: business.id,
    type: 'demo_initialized',
    actor: 'system',
    detail:
      '432 synthetic tasks loaded for exploring the prototype. All historical numbers are illustrative.',
  });
  return state;
}
