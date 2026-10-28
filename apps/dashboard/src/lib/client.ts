import { createBrowserClient } from '@supabase/ssr';
import type { Business, ComponentDefinition, SectorPack, WorkspaceState } from '@gluons/runtime';
export interface WorkspaceResponse {
  state: WorkspaceState;
  components: ComponentDefinition[];
  sectorPacks: SectorPack[];
  models: Record<string, { id: string; name: string; input: number; output: number }>;
  pricingDate: string;
  storage: 'local' | 'supabase';
  actor: string;
  aiMode: 'demo' | 'gateway';
  connections: Record<string, boolean>;
}
export async function api<T = Record<string, unknown>>(
  url: string,
  method = 'GET',
  data?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Request failed.');
  return result;
}
export const browserSupabase = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      )
    : null;
export interface PanelProps {
  data: WorkspaceResponse;
  business: Business;
  refresh: () => Promise<void>;
  toast: (message: string) => void;
  navigate: (tab: string, packId?: string) => void;
}
