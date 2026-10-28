import { NextResponse } from 'next/server';
import { z } from 'zod';
import { decideAction } from '@gluons/runtime';
import { getContext } from '@/lib/server/store';
import { apiError, body, sameOrigin } from '@/lib/server/http';
import { execute } from '@/lib/server/execution';
const schema = z.object({
  decision: z.enum(['approve', 'reject', 'execute']),
  edit: z
    .object({
      summary: z.string().min(5).max(180),
      details: z.string().min(5).max(3000),
      quantity: z.number().int().min(1).max(1000).optional(),
      amount: z.number().positive().max(1000000).optional(),
    })
    .optional(),
});
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const { id } = await params;
    const input = schema.parse(await body(request));
    const { store, actor } = await getContext();
    if (input.decision !== 'execute')
      await store.mutate((s) =>
        decideAction(s, id, input.decision as 'approve' | 'reject', actor, input.edit),
      );
    const action =
      input.decision === 'reject'
        ? (await store.read()).actions.find((a) => a.id === id)
        : await execute(store, id);
    return NextResponse.json({ action });
  } catch (e) {
    return apiError(e);
  }
}
