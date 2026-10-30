import { z } from 'zod';

export const componentIds = [
  'phone-agent',
  'order-taker',
  'stock-monitor',
  'ledger',
  'customer-service',
  'daily-report',
  'job-intake',
  'job-sheet',
] as const;
export type ComponentId = (typeof componentIds)[number];
export type Tier = 'cheap' | 'medium' | 'frontier';
export type ActionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'executed'
  | 'simulated'
  | 'execution_unknown';
export interface ComponentDefinition {
  id: ComponentId;
  version: string;
  layer: 'core';
  name: string;
  description: string;
  triggers: string[];
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  decisions: { id: string; engine: string; type: string; question: string }[];
  actions: { id: string; risk: 'low' | 'medium' | 'high'; requires_approval: true }[];
  models: { default: Tier; escalate_to: Tier };
  human_minutes_per_task: number;
  tests: string;
}
export interface SectorPack {
  id: string;
  name: string;
  version: string;
  description: string;
  uses: ComponentId[];
  schemas: Record<string, string>;
  rules: string[];
  built_by: { ai_expert: string; sector_expert: string };
  color: string;
}
export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  ingredients?: Record<string, number>;
}
export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
  unit: string;
}
export interface Business {
  id: string;
  name: string;
  ownerName: string;
  sectorPackId: string;
  mode: 'trial' | 'live';
  currency: 'USD';
  phone: string;
  hours: string;
  createdAt: string;
  baseline: { monthlyStaffCost: number; monthlyStaffHours: number; reviewMinutesPerTask: number };
  catalog: CatalogItem[];
  stock: StockItem[];
}
export interface Integration {
  id: string;
  businessId: string;
  sectorPackId: string;
  componentIds: ComponentId[];
  versions: Record<string, string>;
  status: 'active';
  createdAt: string;
}
export interface Decision {
  difficulty: 'easy' | 'moderate' | 'hard';
  needsHuman: boolean;
  reason: string;
  engine: 'demo-rules' | 'typesafe-ai/jev';
  costUsd: number;
  inputTokens: number;
  costEstimated: boolean;
  stockAlert?: boolean;
}
export interface Attempt {
  model: string;
  tier: Tier;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  valid: boolean;
  error?: string;
  costEstimated: boolean;
  usageKnown?: boolean;
}
export interface Task {
  id: string;
  businessId: string;
  componentId: ComponentId;
  trigger: string;
  input: string;
  createdAt: string;
  status: 'staged' | 'failed';
  decision: Decision;
  attempts: Attempt[];
  model: string;
  costUsd: number;
  durationMs: number;
  escalated: boolean;
  humanMinutes: number;
  provider: 'demo' | 'gateway';
  eventId?: string;
  error?: string;
  preparation?: { engines: string[]; sourceSha256: string; durationMs: number; warnings: string[] };
}
export const proposalSchema = z.object({
  kind: z.enum([
    'create_order',
    'stock_alert',
    'ledger_entry',
    'send_reply',
    'daily_report',
    'create_job',
    'job_sheet',
  ]),
  summary: z.string().min(5).max(180),
  details: z.string().min(5).max(3000),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
});
export type Proposal = z.infer<typeof proposalSchema>;
export interface ProposedAction extends Proposal {
  id: string;
  taskId: string;
  businessId: string;
  status: ActionStatus;
  risk: 'low' | 'medium' | 'high';
  mode: 'trial' | 'live';
  createdAt: string;
  approvedBy?: string;
  decidedAt?: string;
  executedAt?: string;
  edited: boolean;
  original?: Proposal;
  result?: string;
}
export interface AuditEvent {
  id: string;
  at: string;
  businessId: string;
  actionId?: string;
  type: string;
  actor: string;
  detail: string;
}
export interface Effect {
  id: string;
  actionId: string;
  businessId: string;
  kind: string;
  data: Proposal['data'];
  at: string;
}
export interface Booking {
  id: string;
  name: string;
  email: string;
  business: string;
  createdAt: string;
}
export interface WorkspaceState {
  revision: number;
  businesses: Business[];
  integrations: Integration[];
  tasks: Task[];
  actions: ProposedAction[];
  audit: AuditEvent[];
  effects: Effect[];
  bookings: Booking[];
}
export const taskInputSchema = z.object({
  businessId: z.string().min(1),
  componentId: z.enum(componentIds),
  trigger: z
    .enum([
      'phone_call',
      'whatsapp_message',
      'scheduled_check',
      'receipt',
      'manual',
      'daily_schedule',
    ])
    .default('manual'),
  transcript: z.string().trim().min(3).max(6000),
  catalogItemId: z.string().optional(),
  quantity: z.number().int().min(1).max(1000).optional(),
  stockItemId: z.string().optional(),
  stockQuantity: z.number().min(0).max(1000000).optional(),
  amount: z.number().positive().max(1000000).optional(),
  to: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/)
    .optional(),
  eventId: z.string().max(180).optional(),
  forceEscalation: z.boolean().optional(),
  timezoneOffsetMinutes: z.number().int().min(-840).max(840).optional(),
  referenceTime: z.string().datetime().optional(),
});
export type TaskInput = z.infer<typeof taskInputSchema>;
export interface ModelProvider {
  name: 'demo' | 'gateway';
  modelId?(tier: Tier): string;
  decide(input: TaskInput, business: Business): Promise<Decision>;
  generate(
    tier: Tier,
    input: TaskInput,
    business: Business,
    system: string,
  ): Promise<{ proposal: unknown; attempt: Omit<Attempt, 'valid' | 'error'> }>;
}
export class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
