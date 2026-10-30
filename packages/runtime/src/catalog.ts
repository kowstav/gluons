import type { ComponentDefinition, SectorPack } from './types';
import phone from '../../components/phone-agent/definition.json';
import orders from '../../components/order-taker/definition.json';
import stock from '../../components/stock-monitor/definition.json';
import ledger from '../../components/ledger/definition.json';
import support from '../../components/customer-service/definition.json';
import report from '../../components/daily-report/definition.json';
import food from '../../sector-packs/food-vendor/pack.json';
import retail from '../../sector-packs/retail-shop/pack.json';
import jobs from '../../components/job-intake/definition.json';
import sheets from '../../components/job-sheet/definition.json';
import field from '../../sector-packs/field-service/pack.json';
import property from '../../sector-packs/property-maintenance/pack.json';
import repair from '../../sector-packs/vehicle-repair/pack.json';
import fleet from '../../sector-packs/small-fleet/pack.json';
export const components = [
  phone,
  orders,
  stock,
  ledger,
  support,
  report,
  jobs,
  sheets,
] as ComponentDefinition[];
export const sectorPacks = [food, retail, field, property, repair, fleet] as SectorPack[];
export const models = {
  cheap: { id: 'anthropic/claude-haiku-5.5', name: 'Claude Haiku 5.5', input: 0.1, output: 0.5 },
  medium: { id: 'anthropic/claude-sonnet-5.5', name: 'Claude Sonnet 5.5', input: 2, output: 10 },
  frontier: { id: 'anthropic/claude-opus-5.5', name: 'Claude Opus 5.5', input: 4, output: 20 },
} as const;
// USD / 1M tokens. Snapshot from Vercel model pages, 2026-10-28; configurable in live adapter.
export const pricingDate = '2026-10-28';
export function tokenCost(tier: keyof typeof models, input: number, output: number) {
  return (models[tier].input * input + models[tier].output * output) / 1_000_000;
}
