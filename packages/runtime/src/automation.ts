import Fuse from 'fuse.js';
import Papa from 'papaparse';
import { Engine } from 'json-rules-engine';
import * as chrono from 'chrono-node';
import { DomainError, type Business, type TaskInput } from './types';

export const workflowIds = [
  'receipt',
  'job_request',
  'stock_csv',
  'job_sheet',
  'customer_reply',
  'order_text',
] as const;
export type WorkflowId = (typeof workflowIds)[number];

export function receiptAmount(text: string) {
  if (/\b(EUR|GBP|INR|CAD|AUD)\b|[€£₹]/i.test(text))
    throw new DomainError(
      'This workspace records USD only. Convert and confirm the amount before staging.',
    );
  if (!/\bUSD\b|\$/i.test(text))
    throw new DomainError('Confirm an explicit USD currency and total before staging.');
  const values = [
    ...text.matchAll(
      /(?:^|\n)\s*(?:grand\s+total|amount\s+due|total(?:\s+due)?)\s*[:\s]*(?:USD\s*|\$\s*)?(\d{1,7}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD)?\s*(?=\n|$)/gi,
    ),
  ].map((m) => Number(m[1].replaceAll(',', '')));
  if (!values.length || new Set(values).size !== 1 || values[0] <= 0 || values[0] > 1e6)
    throw new DomainError(
      'A unique positive total was not found. Add one line such as “Total: USD 48.50”, after checking the document.',
    );
  return values[0];
}

export function readCsv(text: string, required: string[]) {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
    transform: (v) => v.trim(),
  });
  if (result.errors.length || required.some((h) => !result.meta.fields?.includes(h)))
    throw new DomainError(`Use a valid CSV with columns: ${required.join(', ')}.`);
  if (!result.data.length || result.data.length > 20)
    throw new DomainError('Import between 1 and 20 rows at a time.');
  return result.data;
}

export function summarizeJobSheet(text: string) {
  const rows = readCsv(text, ['job', 'minutes', 'status']);
  const ids = new Set<string>();
  let completed = 0,
    minutes = 0;
  for (const row of rows) {
    if (
      !row.job ||
      ids.has(row.job) ||
      !/^\d+(?:\.\d+)?$/.test(row.minutes) ||
      Number(row.minutes) > 1440 ||
      !['completed', 'pending'].includes(row.status)
    )
      throw new DomainError(
        'Each job must be unique, minutes must be 0–1440, and status must be completed or pending.',
      );
    ids.add(row.job);
    if (row.status === 'completed') {
      completed++;
      minutes += Number(row.minutes);
    }
  }
  return {
    rows: rows.length,
    completed,
    pending: rows.length - completed,
    minutes: Math.round(minutes * 100) / 100,
  };
}

export function parseJobRequest(input: TaskInput) {
  const offset = input.timezoneOffsetMinutes ?? 0;
  const dates = chrono.parse(
    input.transcript,
    { instant: new Date(input.referenceTime ?? Date.now()), timezone: offset },
    { forwardDate: true },
  );
  const date =
    dates.length === 1 && dates[0].start.isCertain('hour')
      ? dates[0].start.date().toISOString()
      : '';
  const urgent =
    /gas\s*(?:smell|leak)|fire|sparking|electri.*shock|carbon monoxide|flood|brake.*fail/i.test(
      input.transcript,
    );
  return {
    requestedAt: date,
    timezoneOffsetMinutes: offset,
    urgent,
    schedulingStatus: 'Unconfirmed request; owner must confirm time, scope and availability',
  };
}

export function businessAnswer(text: string, business: Business) {
  if (/refund|allerg|complaint|urgent|safety|gas\s+leak/i.test(text))
    return 'The owner needs to review this request personally. No commitment has been made.';
  const facts = [
    {
      question: 'opening hours open close closing time',
      answer: `Our opening hours are ${business.hours}.`,
    },
    {
      question: 'phone telephone contact number',
      answer: `Our contact number is ${business.phone}.`,
    },
    ...business.catalog.map((i) => ({
      question: i.name,
      answer: `${i.name} is listed at USD ${i.price.toFixed(2)}. The owner must confirm availability.`,
    })),
  ];
  const query = /hours|open|clos(?:e|ing)|what time/i.test(text)
    ? 'opening hours'
    : /phone|telephone|contact number/i.test(text)
      ? 'phone telephone'
      : text;
  const match = new Fuse(facts, {
    keys: ['question'],
    threshold: 0.45,
    ignoreLocation: true,
    includeScore: true,
  }).search(query)[0];
  return match
    ? match.item.answer
    : 'The owner will review your question and confirm the details. No answer was found in the configured business information.';
}

export function matchCatalog(text: string, business: Business) {
  const matches = new Fuse(business.catalog, {
    keys: ['name'],
    threshold: 0.5,
    ignoreLocation: true,
    includeScore: true,
  }).search(text);
  if (
    !matches.length ||
    (matches[1] && Math.abs((matches[0].score ?? 1) - (matches[1].score ?? 1)) < 0.1)
  )
    throw new DomainError(
      'The catalog match is unclear. Select the exact catalog item in the task form.',
    );
  return matches[0].item;
}

export async function stockCandidates(text: string, business: Business) {
  const rows = readCsv(text, ['id', 'quantity']);
  const seen = new Set<string>();
  const candidates: TaskInput[] = [];
  for (const row of rows) {
    const item = business.stock.find((s) => s.id === row.id);
    if (!item || seen.has(row.id) || !/^\d+(?:\.\d+)?$/.test(row.quantity) || +row.quantity > 1e6)
      throw new DomainError(
        'Use unique configured stock IDs and non-negative numeric quantities. Thresholds come from your business setup.',
      );
    seen.add(row.id);
    const engine = new Engine([
      {
        conditions: {
          all: [{ fact: 'quantity', operator: 'lessThanInclusive', value: item.threshold }],
        },
        event: { type: 'low-stock' },
      },
    ]);
    const { events } = await engine.run({ quantity: +row.quantity });
    if (events.length)
      candidates.push({
        businessId: business.id,
        componentId: 'stock-monitor',
        trigger: 'manual',
        transcript: `Stock count import: ${item.name}, ${row.quantity} ${item.unit}. Owner review required; no supplier order.`,
        stockItemId: item.id,
        stockQuantity: +row.quantity,
      });
  }
  return candidates;
}
