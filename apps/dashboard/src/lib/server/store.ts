import 'server-only';
import { readFile, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSeed, DomainError, type WorkspaceState } from '@gluons/runtime';

export interface Store {
  read(): Promise<WorkspaceState>;
  mutate<T>(fn: (state: WorkspaceState) => T | Promise<T>): Promise<T>;
}
const dataPath = path.resolve(
  /* turbopackIgnore: true */
  process.env.GLUONS_DATA_PATH ?? path.join(process.cwd(), '.data/workspace.json'),
);
const globalStore = globalThis as typeof globalThis & { gluonsQueue?: Promise<unknown> };
export class LocalStore implements Store {
  async read() {
    try {
      return JSON.parse(
        await readFile(/* turbopackIgnore: true */ dataPath, 'utf8'),
      ) as WorkspaceState;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      return createSeed();
    }
  }
  async mutate<T>(fn: (state: WorkspaceState) => T | Promise<T>) {
    const next = (globalStore.gluonsQueue ?? Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const state = await this.read();
        const result = await fn(state);
        state.revision++;
        await mkdir(path.dirname(dataPath), { recursive: true });
        const temporary = `${dataPath}.${crypto.randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(state), 'utf8');
        await rename(temporary, dataPath);
        return result;
      });
    globalStore.gluonsQueue = next;
    return next;
  }
}
export class SupabaseStore implements Store {
  constructor(
    private client: SupabaseClient,
    private ownerId: string,
  ) {}
  async read() {
    const { data, error } = await this.client
      .from('workspaces')
      .select('state')
      .eq('owner_id', this.ownerId)
      .maybeSingle();
    if (error) throw new DomainError('Database unavailable. Check the Supabase migration.', 503);
    if (data) return data.state as WorkspaceState;
    const seed = await createSeed();
    const { error: insertError } = await this.client.rpc('save_workspace', {
      payload: seed,
      expected_revision: -1,
      target_owner: this.ownerId,
    });
    if (insertError) {
      const retry = await this.client
        .from('workspaces')
        .select('state')
        .eq('owner_id', this.ownerId)
        .single();
      if (retry.error) throw new DomainError('Could not initialize the workspace.', 503);
      return retry.data.state as WorkspaceState;
    }
    return seed;
  }
  async mutate<T>(fn: (state: WorkspaceState) => T | Promise<T>) {
    const state = await this.read();
    const previous = state.revision;
    const result = await fn(state);
    state.revision++;
    const { error } = await this.client.rpc('save_workspace', {
      payload: state,
      expected_revision: previous,
      target_owner: this.ownerId,
    });
    if (error)
      throw new DomainError(
        error.message.includes('revision_conflict')
          ? 'Another update arrived. Refresh and try again.'
          : 'Database update failed.',
        error.message.includes('revision_conflict') ? 409 : 503,
      );
    return result;
  }
}
export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export async function getContext() {
  if (!supabaseConfigured()) {
    if (
      process.env.VERCEL ||
      (process.env.NODE_ENV === 'production' && process.env.GLUONS_ALLOW_LOCAL_DEMO !== 'true')
    )
      throw new DomainError(
        'Configure Supabase for hosted use. For a local production preview, set GLUONS_ALLOW_LOCAL_DEMO=true.',
        503,
      );
    return {
      store: new LocalStore() as Store,
      actor: 'Alex Morgan · demo owner',
      storage: 'local' as const,
    };
  }
  const jar = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) =>
          values.forEach(({ name, value, options }) => jar.set(name, value, options)),
      },
    },
  );
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new DomainError('Sign in to your business workspace.', 401);
  return {
    store: new SupabaseStore(client, user.id) as Store,
    actor: user.email ?? user.id,
    storage: 'supabase' as const,
  };
}
export function webhookStore(): Store {
  if (!supabaseConfigured()) {
    if (process.env.NODE_ENV === 'production' && process.env.GLUONS_ALLOW_LOCAL_DEMO !== 'true')
      throw new DomainError('Configure Supabase before enabling webhooks.', 503);
    return new LocalStore();
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.WEBHOOK_OWNER_ID)
    throw new DomainError('Webhook workspace is not configured.', 503);
  return new SupabaseStore(
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    }),
    process.env.WEBHOOK_OWNER_ID,
  );
}
