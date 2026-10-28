import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { DomainError, processTask, type Business, type TaskInput } from '@gluons/runtime';
import { provider } from './providers';
import { webhookStore } from './store';
import { logTask } from './telemetry';
export function verifySecret(received: string | null, expected: string | undefined) {
  if (
    !expected ||
    !received ||
    Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
    throw new DomainError('Invalid webhook authentication.', 401);
}
export function extractOrder(text: string, business: Business) {
  const item = business.catalog.find((i) => text.toLowerCase().includes(i.name.toLowerCase()));
  if (!item) return {};
  const quantity = Number(text.match(/\b(\d{1,3})\b/)?.[1] ?? 1);
  return { catalogItemId: item.id, quantity };
}
export async function ingest(input: (business: Business) => TaskInput) {
  const store = webhookStore();
  const task = await store.mutate(async (state) => {
    const business = state.businesses.find((b) => b.id === process.env.WEBHOOK_BUSINESS_ID);
    if (!business)
      throw new DomainError('WEBHOOK_BUSINESS_ID must name a configured business.', 503);
    return processTask(state, input(business), provider());
  });
  await logTask(task);
  return task;
}
