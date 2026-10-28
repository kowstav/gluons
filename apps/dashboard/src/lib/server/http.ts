import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DomainError } from '@gluons/runtime';
export function apiError(error: unknown) {
  if (error instanceof DomainError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') },
      { status: 400 },
    );
  console.error('Gluons request failed:', error instanceof Error ? error.message : 'Unknown error');
  return NextResponse.json(
    { error: 'The request could not be completed. Please try again.' },
    { status: 500 },
  );
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 24000) throw new DomainError('Request is too large.', 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError('Expected a JSON request body.');
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  // Next may normalize request.url to localhost while the browser uses 127.0.0.1.
  // Host is the target selected by the browser; cross-site scripts cannot change it.
  if (origin && new URL(origin).host !== (request.headers.get('host') ?? new URL(request.url).host))
    throw new DomainError('Cross-origin request refused.', 403);
}
const limits = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, max = 30) {
  const now = Date.now();
  const bucket = limits.get(key);
  if (!bucket || bucket.until < now) {
    limits.set(key, { count: 1, until: now + 60000 });
    return;
  }
  if (++bucket.count > max) throw new DomainError('Too many requests. Try again in a minute.', 429);
}
