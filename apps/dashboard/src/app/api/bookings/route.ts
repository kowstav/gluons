import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { LocalStore, supabaseConfigured } from '@/lib/server/store';
import { apiError, body, rateLimit, sameOrigin } from '@/lib/server/http';
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(180),
  business: z.string().trim().min(2).max(120),
  website: z.string().max(0).optional(),
});
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    rateLimit(`booking:${request.headers.get('x-forwarded-for') ?? 'local'}`, 5);
    const input = schema.parse(await body(request));
    const booking = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      business: input.business,
      createdAt: new Date().toISOString(),
    };
    if (supabaseConfigured()) {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { error } = await client.from('trial_requests').insert({
        id: booking.id,
        name: booking.name,
        email: booking.email,
        business: booking.business,
      });
      if (error) throw error;
    } else {
      await new LocalStore().mutate((s) => {
        s.bookings.push(booking);
      });
    }
    return NextResponse.json(
      {
        ok: true,
        message:
          'Your trial request is saved. The Gluons team can contact you using these details.',
      },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e);
  }
}
