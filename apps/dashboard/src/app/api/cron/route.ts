import { NextResponse } from 'next/server';
import { apiError } from '@/lib/server/http';
import { verifySecret } from '@/lib/server/webhooks';
import { webhookStore } from '@/lib/server/store';
import { provider } from '@/lib/server/providers';
import { logTask } from '@/lib/server/telemetry';
import { DomainError, processTask, type Task, type TaskInput } from '@gluons/runtime';
export const maxDuration = 120;
export async function GET(request: Request) {
  try {
    verifySecret(
      request.headers.get('authorization'),
      process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined,
    );
    const day = new Date().toISOString().slice(0, 10);
    const tasks = await webhookStore().mutate(async (state) => {
      const business = state.businesses.find((b) => b.id === process.env.WEBHOOK_BUSINESS_ID);
      if (!business)
        throw new DomainError('Configure WEBHOOK_BUSINESS_ID before scheduling tasks.', 503);
      const enabled =
        state.integrations.find((i) => i.businessId === business.id)?.componentIds ?? [];
      const inputs: TaskInput[] = [];
      if (enabled.includes('daily-report'))
        inputs.push({
          businessId: business.id,
          componentId: 'daily-report',
          trigger: 'daily_schedule',
          transcript: 'Prepare the daily operations report.',
          eventId: `daily:${day}`,
        });
      if (enabled.includes('stock-monitor'))
        for (const item of business.stock.filter((s) => s.quantity <= s.threshold))
          inputs.push({
            businessId: business.id,
            componentId: 'stock-monitor',
            trigger: 'scheduled_check',
            transcript: `Check ${item.name} before the next peak period.`,
            stockItemId: item.id,
            stockQuantity: item.quantity,
            eventId: `stock:${day}:${item.id}:${item.quantity}`,
          });
      const results: Task[] = [];
      for (const input of inputs) results.push(await processTask(state, input, provider()));
      return results;
    });
    for (const task of tasks) await logTask(task);
    return NextResponse.json({ taskIds: tasks.map((t) => t.id) });
  } catch (e) {
    return apiError(e);
  }
}
