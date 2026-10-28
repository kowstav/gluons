import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { DomainError } from '@gluons/runtime';
import { apiError } from '@/lib/server/http';
import { extractOrder, ingest } from '@/lib/server/webhooks';
export async function POST(request: Request) {
  try {
    if (!process.env.TWILIO_AUTH_TOKEN || !process.env.PUBLIC_APP_URL)
      throw new DomainError('Twilio webhook is not configured.', 503);
    const text = await request.text();
    if (text.length > 16000) throw new DomainError('Payload too large.', 413);
    const params = Object.fromEntries(new URLSearchParams(text));
    const signature = request.headers.get('x-twilio-signature') ?? '';
    const url = new URL('/api/webhooks/twilio', process.env.PUBLIC_APP_URL).toString();
    if (!twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params))
      throw new DomainError('Invalid Twilio signature.', 401);
    if (!params.MessageSid || !params.From?.startsWith('whatsapp:'))
      throw new DomainError('Expected an inbound WhatsApp message.');
    await ingest((b) => {
      const order = extractOrder(params.Body ?? '', b);
      return {
        businessId: b.id,
        componentId: order.catalogItemId ? 'order-taker' : 'customer-service',
        trigger: 'whatsapp_message',
        transcript: params.Body ?? '',
        to: params.From.replace('whatsapp:', ''),
        eventId: `twilio:${params.MessageSid}`,
        ...order,
      };
    });
    return new NextResponse('<Response/>', { headers: { 'Content-Type': 'text/xml' } });
  } catch (e) {
    return apiError(e);
  }
}
