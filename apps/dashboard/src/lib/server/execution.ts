import 'server-only';
import twilio from 'twilio';
import { audit, DomainError, executeLocal, type ProposedAction } from '@gluons/runtime';
import type { Store } from './store';
export async function execute(store: Store, id: string) {
  const state = await store.read();
  const action = state.actions.find((a) => a.id === id);
  if (!action) throw new DomainError('Action not found.', 404);
  if (action.mode === 'trial' || action.kind !== 'send_reply' || action.data.channel !== 'whatsapp')
    return store.mutate((s) => executeLocal(s, id));
  if (action.status === 'executed') return action;
  if (action.status !== 'approved' || !action.approvedBy)
    throw new DomainError('Action must be approved and unclaimed.', 409);
  if (
    process.env.LIVE_ACTIONS_ENABLED !== 'true' ||
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_WHATSAPP_FROM
  )
    throw new DomainError(
      'Live WhatsApp is not configured. Approval is recorded; delivery has not run.',
      503,
    );
  if (typeof action.data.to !== 'string' || !/^\+[1-9]\d{7,14}$/.test(action.data.to))
    throw new DomainError('A valid approved recipient is required.');
  await store.mutate((s) => {
    const a = s.actions.find((a) => a.id === id)!;
    if (a.status !== 'approved') throw new DomainError('Action was already claimed.', 409);
    a.status = 'executing';
    audit(
      s,
      a.businessId,
      'execution_claimed',
      'runtime',
      'Delivery claimed; retries are blocked until the outcome is known.',
      id,
    );
  });
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const sent = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${action.data.to}`,
      body: action.details,
    });
    return await store.mutate((s) => {
      const a = s.actions.find((a) => a.id === id)!;
      a.status = 'executed';
      a.executedAt = new Date().toISOString();
      a.result = `Twilio accepted message ${sent.sid}. Delivery confirmation is available in Twilio.`;
      s.effects.push({
        id: crypto.randomUUID(),
        actionId: id,
        businessId: a.businessId,
        kind: a.kind,
        data: a.data,
        at: a.executedAt,
      });
      audit(s, a.businessId, 'executed', 'twilio', a.result, id);
      return a;
    });
  } catch {
    await store.mutate((s) => {
      const a = s.actions.find((a) => a.id === id)!;
      a.status = 'execution_unknown';
      a.result =
        'Delivery outcome is uncertain. Reconcile with Twilio before retrying to prevent duplicates.';
      audit(s, a.businessId, 'execution_unknown', 'runtime', a.result, id);
    });
    throw new DomainError(
      'Delivery outcome is uncertain. Check Twilio before taking further action.',
      502,
    );
  }
}
