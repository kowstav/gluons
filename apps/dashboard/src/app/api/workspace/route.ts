import { NextResponse } from 'next/server';
import { components, sectorPacks, models, pricingDate } from '@gluons/runtime';
import { getContext } from '@/lib/server/store';
import { apiError } from '@/lib/server/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { store, storage, actor } = await getContext();
    const state = await store.read();
    return NextResponse.json(
      {
        state: { ...state, bookings: [] },
        components,
        sectorPacks,
        models,
        pricingDate,
        storage,
        actor,
        aiMode:
          process.env.GLUONS_AI_MODE === 'gateway' && Boolean(process.env.AI_GATEWAY_API_KEY)
            ? 'gateway'
            : 'demo',
        connections: {
          supabase: storage === 'supabase',
          gateway: Boolean(process.env.AI_GATEWAY_API_KEY),
          twilio: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
          vapi: Boolean(process.env.VAPI_WEBHOOK_SECRET),
          langfuse: Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e);
  }
}
