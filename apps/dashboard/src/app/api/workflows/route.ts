import { NextResponse } from 'next/server';
import { runWorkflow } from '@gluons/runtime';
import { getContext } from '@/lib/server/store';
import { apiError, body, sameOrigin, rateLimit } from '@/lib/server/http';
import { provider } from '@/lib/server/providers';
import { logTask } from '@/lib/server/telemetry';
export const maxDuration = 120;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { store, actor } = await getContext();
    rateLimit(`workflows:${actor}`, 10);
    const input = await body(request);
    const result = await store.mutate((s) => runWorkflow(s, input, provider()));
    await Promise.all(result.tasks.map(logTask));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
