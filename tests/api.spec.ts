import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('document API runs real PDF extraction and local OCR in production', async ({ request }) => {
  for (const [name, mimeType] of [
    ['invoice.pdf', 'application/pdf'],
    ['invoice.png', 'image/png'],
  ]) {
    const response = await request.post('/api/documents', {
      multipart: {
        purpose: 'receipt',
        file: { name, mimeType, buffer: await readFile(`tests/fixtures/${name}`) },
      },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.amount).toBe(48.5);
    expect(data.text).toContain('48.50');
  }
});
test('document intake reads a real invoice and workflows stage rather than execute it', async ({
  request,
}) => {
  const state = await (await request.get('/api/workspace')).json();
  const doc = await request.post('/api/documents', {
    multipart: {
      purpose: 'receipt',
      file: {
        name: 'invoice.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Invoice: GL-100\nDate: 2026-10-30\nTotal: USD 48.50'),
      },
    },
  });
  expect(doc.ok()).toBeTruthy();
  const parsed = await doc.json();
  expect(parsed.amount).toBe(48.5);
  const input = {
    businessId: state.state.businesses[0].id,
    workflow: 'receipt',
    text: parsed.text,
    eventId: `invoice-http-${Date.now()}`,
  };
  const response = await request.post('/api/workflows', { data: input });
  expect(response.status()).toBe(201);
  const result = await response.json();
  expect(result.tasks[0].status).toBe('staged');
  expect(result.tasks[0].preparation.sourceSha256).toHaveLength(64);
  const after = await (await request.get('/api/workspace')).json();
  const action = after.state.actions.find(
    (a: { taskId: string }) => a.taskId === result.tasks[0].id,
  );
  expect(action.status).toBe('pending');
  const replay = await (await request.post('/api/workflows', { data: input })).json();
  expect(replay.tasks[0].id).toBe(result.tasks[0].id);
});
test('new sector setup enables work requests and produces an unconfirmed approval proposal', async ({
  request,
}) => {
  const created = await request.post('/api/integrations', {
    data: {
      name: 'Example Field Team',
      ownerName: 'Demo Owner',
      sectorPackId: 'field-service',
      componentIds: ['job-intake', 'job-sheet', 'ledger'],
      phone: '+12025550142',
      hours: 'Mon-Fri 9-5',
      monthlyStaffCost: 3200,
      monthlyStaffHours: 208,
      catalog: [{ id: 'visit', name: 'Site visit', price: 50 }],
      stock: [],
    },
  });
  expect(created.status()).toBe(201);
  const { business } = await created.json();
  const staged = await request.post('/api/workflows', {
    data: {
      businessId: business.id,
      workflow: 'job_request',
      text: 'Please visit tomorrow at 10 am',
      timezoneOffsetMinutes: 330,
      eventId: `visit-${Date.now()}`,
    },
  });
  expect(staged.status()).toBe(201);
  const { tasks } = await staged.json();
  expect(tasks[0].status).toBe('staged');
  const state = await (await request.get('/api/workspace')).json();
  const action = state.state.actions.find((a: { taskId: string }) => a.taskId === tasks[0].id);
  expect(action.kind).toBe('create_job');
  expect(action.data.schedulingStatus).toContain('Unconfirmed');
  expect(action.status).toBe('pending');
});
test('public marketing and demo captions keep internal delivery strategy out of customer copy', async ({
  request,
}) => {
  const page = await request.get('/');
  expect(page.ok()).toBeTruthy();
  const html = await page.text();
  const customerText = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  const internalStrategy =
    /expert once|sector packs?|reusable (?:components|blocks|AI helpers)|core library|used by \d+ businesses|commission.based|healthy margin|contract AI expert|intern using/i;
  expect(customerText).not.toMatch(internalStrategy);
  expect(customerText).not.toMatch(/github\.com|open source/i);
  const captions = await request.get('/demo.vtt');
  expect(captions.ok()).toBeTruthy();
  expect(await captions.text()).not.toMatch(internalStrategy);
});
test('full HTTP task -> edit -> approval -> trial -> report state', async ({ request }) => {
  const response = await request.get('/api/workspace');
  expect(response.ok()).toBeTruthy();
  const workspace = await response.json();
  const business = workspace.state.businesses[0];
  const created = await request.post('/api/tasks', {
    data: {
      businessId: business.id,
      componentId: 'order-taker',
      trigger: 'manual',
      transcript: '2 classic burgers for pickup.',
      catalogItemId: business.catalog[0].id,
      quantity: 2,
      forceEscalation: true,
      eventId: `e2e:${Date.now()}`,
    },
  });
  expect(created.status()).toBe(201);
  const { task } = await created.json();
  expect(task.escalated).toBeTruthy();
  const updated = await (await request.get('/api/workspace')).json();
  const action = updated.state.actions.find((a: { taskId: string }) => a.taskId === task.id);
  expect(action.status).toBe('pending');
  const bypass = await request.post(`/api/actions/${action.id}`, { data: { decision: 'execute' } });
  expect(bypass.status()).toBe(409);
  const approved = await request.post(`/api/actions/${action.id}`, {
    data: {
      decision: 'approve',
      edit: {
        summary: 'Reviewed pickup order',
        details: 'Two classic burgers, ready for owner-approved pickup.',
      },
    },
  });
  expect(approved.ok()).toBeTruthy();
  const result = await approved.json();
  expect(result.action.status).toBe('simulated');
  expect(result.action.edited).toBe(true);
  const duplicate = await request.post(`/api/actions/${action.id}`, {
    data: { decision: 'approve' },
  });
  expect(duplicate.status()).toBe(409);
});
test('webhooks require valid secrets and input validation rejects malformed tasks', async ({
  request,
}) => {
  expect((await request.post('/api/webhooks/vapi', { data: {} })).status()).toBe(401);
  expect((await request.get('/api/cron')).status()).toBe(401);
  const invalid = await request.post('/api/tasks', {
    data: { businessId: 'missing', componentId: 'order-taker', transcript: 'hello', quantity: -1 },
  });
  expect(invalid.status()).toBe(400);
  const cross = await request.patch('/api/settings', {
    headers: { origin: 'https://untrusted.example' },
    data: { businessId: 'x', mode: 'live' },
  });
  expect(cross.status()).toBe(403);
});
test('trial request validates email and persists without exposing bookings', async ({
  request,
}) => {
  const invalid = await request.post('/api/bookings', {
    data: { name: 'Test Owner', email: 'wrong', business: 'Test Cafe' },
  });
  expect(invalid.status()).toBe(400);
  const created = await request.post('/api/bookings', {
    data: { name: 'Test Owner', email: 'owner@example.test', business: 'Test Cafe', website: '' },
  });
  expect(created.status()).toBe(201);
  const state = await (await request.get('/api/workspace')).json();
  expect(state.state.bookings).toEqual([]);
});
test('builder persists ingredient mapping, increases reuse counts and executes a live order once', async ({
  request,
}) => {
  const setup = {
    name: 'API test cafe',
    ownerName: 'Test Owner',
    sectorPackId: 'food-vendor',
    componentIds: ['order-taker', 'stock-monitor', 'ledger'],
    phone: '',
    hours: 'Mon–Fri, 9 am–5 pm',
    monthlyStaffCost: 1600,
    monthlyStaffHours: 160,
    catalog: [{ id: 'espresso', name: 'Espresso', price: 3.5, ingredients: { beans: 0.02 } }],
    stock: [{ id: 'beans', name: 'Coffee beans', quantity: 10, threshold: 2, unit: 'kg' }],
  };
  const created = await request.post('/api/integrations', { data: setup });
  expect(created.status()).toBe(201);
  const { business } = await created.json();
  await request.patch('/api/settings', { data: { businessId: business.id, mode: 'live' } });
  const routed = await request.post('/api/tasks', {
    data: {
      businessId: business.id,
      componentId: 'order-taker',
      trigger: 'manual',
      transcript: 'Two espressos please.',
      catalogItemId: 'espresso',
      quantity: 2,
    },
  });
  expect(routed.status()).toBe(201);
  const { task } = await routed.json();
  const staged = await (await request.get('/api/workspace')).json();
  const action = staged.state.actions.find((a: { taskId: string }) => a.taskId === task.id);
  const approved = await request.post(`/api/actions/${action.id}`, {
    data: { decision: 'approve' },
  });
  expect(approved.status()).toBe(200);
  expect((await approved.json()).action.status).toBe('executed');
  await request.post(`/api/actions/${action.id}`, { data: { decision: 'execute' } });
  const final = await (await request.get('/api/workspace')).json();
  expect(
    final.state.businesses.find((b: { id: string }) => b.id === business.id).stock[0].quantity,
  ).toBeCloseTo(9.96);
  expect(
    final.state.effects.filter((e: { actionId: string }) => e.actionId === action.id),
  ).toHaveLength(1);
  expect(
    final.state.integrations.filter((i: { componentIds: string[] }) =>
      i.componentIds.includes('order-taker'),
    ),
  ).toHaveLength(2);
});
