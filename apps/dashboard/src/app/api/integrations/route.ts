import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  audit,
  components,
  componentIds,
  DomainError,
  sectorPacks,
  type Business,
} from '@gluons/runtime';
import { getContext } from '@/lib/server/store';
import { apiError, body, sameOrigin } from '@/lib/server/http';
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  ownerName: z.string().trim().min(2).max(100),
  sectorPackId: z
    .string()
    .refine((id) => sectorPacks.some((p) => p.id === id), 'Choose a supported business type.'),
  componentIds: z.array(z.enum(componentIds)).min(1),
  phone: z.string().max(30),
  hours: z.string().min(3).max(120),
  monthlyStaffCost: z.number().min(0).max(1000000),
  monthlyStaffHours: z.number().positive().max(20000),
  catalog: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        name: z.string().min(1).max(100),
        price: z.number().positive().max(100000),
        ingredients: z.record(z.string(), z.number().positive().max(1000000)).optional(),
      }),
    )
    .min(1)
    .max(100),
  stock: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        name: z.string().min(1).max(100),
        quantity: z.number().min(0),
        threshold: z.number().min(0),
        unit: z.string().min(1).max(20),
      }),
    )
    .max(100),
});
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = schema.parse(await body(request));
    const { store, actor } = await getContext();
    const business = await store.mutate((state) => {
      const pack = sectorPacks.find((p) => p.id === input.sectorPackId)!;
      if (input.componentIds.some((id) => !pack.uses.includes(id)))
        throw new DomainError('Component is not part of this sector pack.');
      if (
        new Set(input.catalog.map((i) => i.id)).size !== input.catalog.length ||
        new Set(input.stock.map((i) => i.id)).size !== input.stock.length
      )
        throw new DomainError('Catalog and stock IDs must be unique.');
      const stockIds = new Set(input.stock.map((s) => s.id));
      if (
        input.catalog.some((item) =>
          Object.keys(item.ingredients ?? {}).some((id) => !stockIds.has(id)),
        )
      )
        throw new DomainError('Every stock mapping must reference a configured stock item.');
      const b: Business = {
        id: crypto.randomUUID(),
        name: input.name,
        ownerName: input.ownerName,
        sectorPackId: input.sectorPackId,
        mode: 'trial',
        currency: 'USD',
        phone: input.phone,
        hours: input.hours,
        createdAt: new Date().toISOString(),
        baseline: {
          monthlyStaffCost: input.monthlyStaffCost,
          monthlyStaffHours: input.monthlyStaffHours,
          reviewMinutesPerTask: 0.5,
        },
        catalog: input.catalog,
        stock: input.stock,
      };
      state.businesses.push(b);
      state.integrations.push({
        id: crypto.randomUUID(),
        businessId: b.id,
        sectorPackId: input.sectorPackId,
        componentIds: [...new Set(input.componentIds)],
        versions: Object.fromEntries(
          components.filter((c) => input.componentIds.includes(c.id)).map((c) => [c.id, c.version]),
        ),
        status: 'active',
        createdAt: b.createdAt,
      });
      audit(
        state,
        b.id,
        'integration_deployed',
        actor,
        `${b.name}: ${input.componentIds.length} reusable components deployed in trial mode.`,
      );
      return b;
    });
    return NextResponse.json({ business }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
