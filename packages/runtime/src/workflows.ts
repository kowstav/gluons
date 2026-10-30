import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  workflowIds,
  receiptAmount,
  stockCandidates,
  summarizeJobSheet,
  matchCatalog,
} from './automation';
import { processTask } from './engine';
import { DomainError, type ModelProvider, type TaskInput, type WorkspaceState } from './types';

export const workflowSchema = z.object({
  businessId: z.string().min(1),
  workflow: z.enum(workflowIds),
  text: z.string().trim().min(3).max(6000),
  quantity: z.number().int().min(1).max(1000).optional(),
  amount: z.number().positive().max(1e6).optional(),
  timezoneOffsetMinutes: z.number().int().min(-840).max(840).default(0),
  eventId: z.string().min(1).max(120),
});
export async function runWorkflow(state: WorkspaceState, raw: unknown, provider: ModelProvider) {
  const input = workflowSchema.parse(raw);
  const business = state.businesses.find((b) => b.id === input.businessId);
  if (!business) throw new DomainError('Business not found.', 404);
  const start = Date.now();
  let engines: string[] = [],
    candidates: TaskInput[] = [],
    warnings: string[] = [];
  const base = { businessId: business.id, trigger: 'manual' as const, transcript: input.text };
  switch (input.workflow) {
    case 'receipt':
      candidates = [
        { ...base, componentId: 'ledger', amount: input.amount ?? receiptAmount(input.text) },
      ];
      engines = ['Gluons total/currency checks'];
      warnings = [
        'Check issuer, currency, totals and duplicate invoices before approval. A document is not evidence that a payment is due.',
      ];
      break;
    case 'job_request':
      candidates = [
        {
          ...base,
          componentId: 'job-intake',
          referenceTime: new Date().toISOString(),
          timezoneOffsetMinutes: input.timezoneOffsetMinutes,
        },
      ];
      engines = ['chrono-node'];
      warnings = ['Requested dates are suggestions; no booking or dispatch is confirmed.'];
      break;
    case 'job_sheet':
      summarizeJobSheet(input.text);
      candidates = [{ ...base, componentId: 'job-sheet' }];
      engines = ['papaparse'];
      break;
    case 'stock_csv':
      candidates = await stockCandidates(input.text, business);
      engines = ['papaparse', 'json-rules-engine'];
      warnings = [
        'Only low counts produce proposals. The import does not silently overwrite inventory or place supplier orders.',
      ];
      break;
    case 'customer_reply':
      candidates = [{ ...base, componentId: 'customer-service' }];
      engines = ['fuse.js'];
      break;
    case 'order_text': {
      const item = matchCatalog(input.text, business);
      if (!input.quantity) throw new DomainError('Enter and confirm an explicit order quantity.');
      candidates = [
        { ...base, componentId: 'order-taker', catalogItemId: item.id, quantity: input.quantity },
      ];
      engines = ['fuse.js'];
    }
  }
  const integration = state.integrations.find((i) => i.businessId === business.id);
  if (provider.name === 'gateway' && candidates.length > 1)
    throw new DomainError(
      'Live AI imports are limited to one qualifying row per request. Split this batch to keep model calls bounded.',
    );
  if (candidates.some((c) => !integration?.componentIds.includes(c.componentId)))
    throw new DomainError(
      'Enable the required service in a new business setup before using this workflow.',
    );
  const preparation = {
    engines,
    sourceSha256: createHash('sha256').update(input.text).digest('hex'),
    durationMs: Date.now() - start,
    warnings,
  };
  for (const index of candidates.keys()) {
    const previous = state.tasks.find(
      (t) => t.businessId === business.id && t.eventId === `workflow:${input.eventId}:${index}`,
    );
    if (previous?.preparation && previous.preparation.sourceSha256 !== preparation.sourceSha256)
      throw new DomainError(
        'This request ID was already used for different source text. Start a new request.',
        409,
      );
  }
  const tasks = [];
  for (const [index, candidate] of candidates.entries()) {
    const task = await processTask(
      state,
      { ...candidate, eventId: `workflow:${input.eventId}:${index}` },
      provider,
    );
    // A replay keeps its original provenance and timestamp.
    task.preparation ??= preparation;
    tasks.push(task);
  }
  return {
    tasks,
    preparation,
    message: tasks.length
      ? `${tasks.length} request(s) prepared. Review the proposed actions in your queue.`
      : 'No stock count is at or below its threshold. No action was staged.',
  };
}
