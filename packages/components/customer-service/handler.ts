import type { Business, Proposal, TaskInput } from '../../runtime/src/types';
import { businessAnswer } from '../../runtime/src/automation';
export function customerService(input: TaskInput, business: Business): Proposal {
  return {
    kind: 'send_reply',
    summary: 'Send a helpful customer reply',
    details: `Thanks for contacting ${business.name}! ${businessAnswer(input.transcript, business)}`,
    data: {
      channel: input.trigger === 'whatsapp_message' ? 'whatsapp' : 'internal',
      ...(input.to ? { to: input.to } : {}),
    },
  };
}
