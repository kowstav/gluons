import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, body } from '@/lib/server/http';
import { extractOrder, ingest, verifySecret } from '@/lib/server/webhooks';
const event = z.object({
  message: z.object({
    type: z.string(),
    call: z.object({ id: z.string().min(1) }),
    artifact: z.object({ transcript: z.string().max(6000) }).optional(),
    transcript: z.string().max(6000).optional(),
    analysis: z
      .object({
        structuredData: z
          .object({ catalogItemId: z.string(), quantity: z.number().int().min(1).max(1000) })
          .optional(),
      })
      .optional(),
  }),
});
export async function POST(request: Request) {
  try {
    verifySecret(request.headers.get('x-gluons-secret'), process.env.VAPI_WEBHOOK_SECRET);
    const { message } = event.parse(await body(request));
    if (message.type !== 'end-of-call-report') return NextResponse.json({ ignored: true });
    const transcript = message.artifact?.transcript ?? message.transcript ?? '';
    const task = await ingest((b) => ({
      businessId: b.id,
      componentId: 'phone-agent',
      trigger: 'phone_call',
      transcript,
      eventId: `vapi:${message.call.id}`,
      ...(message.analysis?.structuredData ?? extractOrder(transcript, b)),
    }));
    return NextResponse.json({ taskId: task.id, status: task.status });
  } catch (e) {
    return apiError(e);
  }
}
