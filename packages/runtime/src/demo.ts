import { models, tokenCost } from './catalog';
import { handlers } from './handlers';
import type { Business, ModelProvider, TaskInput, Tier } from './types';
export class DemoProvider implements ModelProvider {
  name = 'demo' as const;
  async decide(input: TaskInput) {
    const hard =
      /allerg|refund|complaint|bulk|cater|unusual/i.test(input.transcript) ||
      (input.quantity ?? 0) > 20;
    const moderate = /combo|change|multiple|substitut/i.test(input.transcript);
    return {
      difficulty: hard ? ('hard' as const) : moderate ? ('moderate' as const) : ('easy' as const),
      needsHuman: hard,
      reason: hard
        ? 'Unusual or sensitive request needs extra reasoning and owner attention.'
        : moderate
          ? 'Several constraints require a balanced model.'
          : 'Routine request matches the configured business rules.',
      engine: 'demo-rules' as const,
      costUsd: 0.000012,
      inputTokens: 300,
      costEstimated: true,
      ...(input.componentId === 'stock-monitor' ? { stockAlert: true } : {}),
    };
  }
  async generate(tier: Tier, input: TaskInput, business: Business) {
    const proposal = handlers[input.componentId](input, business);
    const inputTokens = 720 + input.transcript.length;
    const outputTokens = 180 + Math.ceil(proposal.details.length / 4);
    return {
      proposal: input.forceEscalation && tier === 'cheap' ? { ...proposal, summary: '' } : proposal,
      attempt: {
        tier,
        model: models[tier].id,
        inputTokens,
        outputTokens,
        costUsd: tokenCost(tier, inputTokens, outputTokens),
        costEstimated: true,
      },
    };
  }
}
