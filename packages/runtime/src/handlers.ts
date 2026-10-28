import type { Business, ComponentId, Proposal, TaskInput } from './types';
import { orderTaker } from '../../components/order-taker/handler';
import { stockMonitor } from '../../components/stock-monitor/handler';
import { ledger } from '../../components/ledger/handler';
import { customerService } from '../../components/customer-service/handler';
import { phoneAgent } from '../../components/phone-agent/handler';
import { dailyReport } from '../../components/daily-report/handler';
export const handlers: Record<ComponentId, (input: TaskInput, business: Business) => Proposal> = {
  'order-taker': orderTaker,
  'stock-monitor': stockMonitor,
  ledger,
  'customer-service': customerService,
  'phone-agent': phoneAgent,
  'daily-report': dailyReport,
};
