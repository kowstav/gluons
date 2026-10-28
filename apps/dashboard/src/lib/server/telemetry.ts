import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Task } from '@gluons/runtime';
export async function logTask(task: Task) {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) return;
  const at = new Date().toISOString();
  const batch = [
    {
      id: randomUUID(),
      type: 'trace-create',
      timestamp: at,
      body: {
        id: task.id,
        name: `gluons.${task.componentId}`,
        timestamp: task.createdAt,
        metadata: {
          businessId: task.businessId,
          provider: task.provider,
          difficulty: task.decision.difficulty,
          costEstimated: true,
        },
        tags: [task.provider, 'approval-required'],
      },
    },
    ...task.attempts.map((a, i) => ({
      id: randomUUID(),
      type: 'generation-create',
      timestamp: at,
      body: {
        id: `${task.id}-${i}`,
        traceId: task.id,
        name: a.tier,
        model: a.model,
        startTime: task.createdAt,
        endTime: at,
        usageDetails: { input: a.inputTokens, output: a.outputTokens },
        costDetails: { total: a.costUsd },
        metadata: { valid: a.valid, error: a.error },
      },
    })),
  ];
  try {
    const response = await fetch(
      `${process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com'}/api/public/ingestion`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batch }),
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!response.ok) console.error('Langfuse ingestion failed with status', response.status);
  } catch {
    console.error('Langfuse unavailable; task remains recorded in the local audit log.');
  }
}
