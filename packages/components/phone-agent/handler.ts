import { orderTaker } from '../order-taker/handler';
import { customerService } from '../customer-service/handler';
import type { Business, TaskInput } from '../../runtime/src/types';
export function phoneAgent(input: TaskInput, business: Business) {
  return input.catalogItemId ? orderTaker(input, business) : customerService(input, business);
}
