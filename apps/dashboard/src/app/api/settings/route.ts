import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, DomainError } from '@gluons/runtime';
import { getContext } from '@/lib/server/store';
import { apiError, body, sameOrigin } from '@/lib/server/http';
const schema = z.object({
  businessId: z.string(),
  mode: z.enum(['trial', 'live']).optional(),
  baseline: z
    .object({
      monthlyStaffCost: z.number().min(0).max(1000000),
      monthlyStaffHours: z.number().positive().max(20000),
      reviewMinutesPerTask: z.number().min(0).max(120),
    })
    .optional(),
});
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const input = schema.parse(await body(request));
    const { store, actor } = await getContext();
    await store.mutate((s) => {
      const b = s.businesses.find((b) => b.id === input.businessId);
      if (!b) throw new DomainError('Business not found.', 404);
      if (input.mode) b.mode = input.mode;
      if (input.baseline) b.baseline = input.baseline;
      audit(
        s,
        b.id,
        'settings_updated',
        actor,
        `Mode: ${b.mode}. Pending proposals retain the mode captured when staged.`,
      );
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
