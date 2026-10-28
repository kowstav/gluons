import { NextResponse } from 'next/server';
import { processTask } from '@gluons/runtime';
import { getContext } from '@/lib/server/store';
import { apiError, body, rateLimit, sameOrigin } from '@/lib/server/http';
import { provider } from '@/lib/server/providers';
import { logTask } from '@/lib/server/telemetry';
export const maxDuration = 120;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { store, actor } = await getContext();
    rateLimit(actor);
    const input = await body(request);
    if (process.env.GLUONS_AI_MODE === 'gateway') delete input.forceEscalation;
    const task = await store.mutate((s) => processTask(s, input, provider()));
    await logTask(task);
    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
