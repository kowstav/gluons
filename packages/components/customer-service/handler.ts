import type { Business, Proposal, TaskInput } from '../../runtime/src/types';
export function customerService(input: TaskInput, business: Business): Proposal {
  return {
    kind: 'send_reply',
    summary: 'Send a helpful customer reply',
    details: `Thanks for contacting ${business.name}! Our opening hours are ${business.hours}. ${/refund|allerg|complaint|urgent/i.test(input.transcript) ? 'The owner will personally review your request and follow up.' : 'Let us know how we can help with your order.'}`,
    data: {
      channel: input.trigger === 'whatsapp_message' ? 'whatsapp' : 'internal',
      ...(input.to ? { to: input.to } : {}),
    },
  };
}
