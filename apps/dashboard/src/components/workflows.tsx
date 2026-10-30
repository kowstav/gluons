'use client';
import { useState } from 'react';
import { FileUp, Play, ShieldCheck, ArrowRight } from 'lucide-react';
import type { ComponentId } from '@gluons/runtime/client';
import { api, type PanelProps } from '@/lib/client';
import { Button, Card, Badge } from './ui';

const workflows: {
  id: string;
  name: string;
  service: ComponentId;
  description: string;
  sample: string;
}[] = [
  {
    id: 'receipt',
    name: 'Invoice & receipt intake',
    service: 'ledger',
    description: 'Read a document, check its total and prepare an expense entry.',
    sample:
      'Invoice: GL-100\nDate: 2026-10-30\nSupplier: Example Supplies\nSubtotal: USD 40.00\nTax: USD 8.50\nTotal: USD 48.50',
  },
  {
    id: 'job_request',
    name: 'Work-request intake',
    service: 'job-intake',
    description: 'Capture requested work and a suggested time. You confirm the next step.',
    sample:
      'Please inspect the leaking tap tomorrow at 10 am. Confirm availability before booking.',
  },
  {
    id: 'stock_csv',
    name: 'Stock-count check',
    service: 'stock-monitor',
    description:
      'Compare a CSV count with your configured thresholds. Low counts come to your queue.',
    sample: 'id,quantity\nbuns,12\npatties,50',
  },
  {
    id: 'job_sheet',
    name: 'Job-sheet summary',
    service: 'job-sheet',
    description: 'Summarise completed and pending work from a checked CSV.',
    sample: 'job,minutes,status\nvisit-101,45,completed\nvisit-102,30,pending',
  },
  {
    id: 'customer_reply',
    name: 'Customer question',
    service: 'customer-service',
    description: 'Prepare a reply using your configured hours, contact details and catalog.',
    sample: 'What are your opening hours?',
  },
  {
    id: 'order_text',
    name: 'Catalog request',
    service: 'order-taker',
    description:
      'Match a request to your catalog, then check the item and quantity before approval.',
    sample: 'Classic burger',
  },
];
export function Workflows({ business, data, refresh, toast, navigate }: PanelProps) {
  const enabled =
    data.state.integrations.find((i) => i.businessId === business.id)?.componentIds ?? [];
  const [workflow, setWorkflow] = useState('receipt'),
    [text, setText] = useState(workflows[0].sample),
    [amount, setAmount] = useState(''),
    [quantity, setQuantity] = useState(1),
    [offset, setOffset] = useState(0),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [documentInfo, setDocumentInfo] = useState(''),
    [eventId, setEventId] = useState('');
  const selected = workflows.find((w) => w.id === workflow)!;
  function changeText(value: string) {
    setText(value);
    setEventId('');
  }
  function choose(id: string) {
    const choice = workflows.find((w) => w.id === id)!;
    setWorkflow(id);
    changeText(
      id === 'stock_csv'
        ? `id,quantity\n${business.stock[0]?.id ?? 'configured-stock-id'},${Math.max(0, (business.stock[0]?.threshold ?? 1) - 1)}`
        : id === 'order_text'
          ? (business.catalog[0]?.name ?? choice.sample)
          : choice.sample,
    );
    setAmount('');
    setDocumentInfo('');
    setError('');
  }
  async function upload(file: File) {
    setBusy('document');
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('purpose', workflow);
      const response = await fetch('/api/documents', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Document reading failed.');
      changeText(result.text);
      setAmount(result.amount === undefined ? '' : String(result.amount));
      setDocumentInfo(
        `${result.engine}. ${result.invoice ? `Template fields: invoice ${result.invoice.invoice_number}, date ${result.invoice.date}, ${result.invoice.currency} ${result.invoice.amount}. ` : ''}${result.warnings.join(' ')}`,
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function stage(e: React.FormEvent) {
    e.preventDefault();
    setBusy('stage');
    setError('');
    const key = eventId || crypto.randomUUID();
    setEventId(key);
    try {
      const result = await api<{ tasks: { status: string; error?: string }[]; message: string }>(
        '/api/workflows',
        'POST',
        {
          businessId: business.id,
          workflow,
          text,
          timezoneOffsetMinutes: offset,
          eventId: key,
          quantity,
          ...(amount ? { amount: Number(amount) } : {}),
        },
      );
      await refresh();
      const failed = result.tasks.find((t) => t.status === 'failed');
      if (failed)
        throw new Error(
          failed.error ?? 'The request needs a manual check. No action was staged for it.',
        );
      toast(result.message);
      if (result.tasks.length) navigate('approvals');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>A head start on the paperwork.</h1>
          <p>
            Prepare everyday work from a document, message or spreadsheet. You review each proposed
            action.
          </p>
        </div>
        <Badge tone="green">
          <ShieldCheck size={14} /> Your approval required
        </Badge>
      </div>
      <div className="workflow-layout">
        <label className="workflow-mobile-select">
          Choose a workflow
          <select value={workflow} onChange={(e) => choose(e.target.value)}>
            {workflows.map((w) => (
              <option value={w.id} key={w.id}>
                {w.name}
                {enabled.includes(w.service) ? '' : ' (service not enabled)'}
              </option>
            ))}
          </select>
        </label>
        <div className="workflow-choices" aria-label="Choose a workflow">
          {workflows.map((w) => (
            <button
              key={w.id}
              className={`workflow-choice ${w.id === workflow ? 'chosen' : ''}`}
              onClick={() => choose(w.id)}
              aria-pressed={w.id === workflow}
            >
              <strong>{w.name}</strong>
              <span>{w.description}</span>
              {!enabled.includes(w.service) && <small>Enable this service in Business setup</small>}
            </button>
          ))}
        </div>
        <Card className="workflow-editor">
          <h2>{selected.name}</h2>
          <p className="muted">
            Check the source and the extracted details before sending them to your queue.
          </p>
          <form className="form-stack" onSubmit={stage}>
            <label className="workflow-upload">
              <FileUp size={20} /> Read a file{' '}
              <span>PDF with text, PNG, JPEG, TXT or CSV · up to 2 MB</span>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,text/plain,text/csv,.csv,.txt"
                disabled={!!busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                  e.target.value = '';
                }}
              />
            </label>
            {busy === 'document' && <p role="status">Reading the document…</p>}
            {documentInfo && (
              <div className="callout" role="status">
                {documentInfo}
              </div>
            )}
            <label>
              {['stock_csv', 'job_sheet'].includes(workflow) ? 'Checked CSV data' : 'Source text'}
              <textarea
                required
                rows={9}
                maxLength={6000}
                value={text}
                onChange={(e) => changeText(e.target.value)}
              />
            </label>
            {workflow === 'receipt' && (
              <label>
                Confirmed amount (USD, optional override)
                <input
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setEventId('');
                  }}
                  placeholder="Read from a unique total, or enter a checked amount"
                />
                <small>
                  Check currency, tax, issuer and duplicates. This prepares an entry; it does not
                  pay an invoice.
                </small>
              </label>
            )}
            {workflow === 'order_text' && (
              <label>
                Confirmed quantity
                <input
                  type="number"
                  required
                  min={1}
                  max={1000}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(+e.target.value);
                    setEventId('');
                  }}
                />
              </label>
            )}
            {workflow === 'job_request' && (
              <label>
                Timezone for requested time
                <select
                  value={offset}
                  onChange={(e) => {
                    setOffset(+e.target.value);
                    setEventId('');
                  }}
                >
                  <option value={0}>UTC</option>
                  <option value={330}>India (UTC+05:30)</option>
                  <option value={-240}>UTC−04:00</option>
                  <option value={-300}>UTC−05:00</option>
                  <option value={60}>UTC+01:00</option>
                </select>
                <small>
                  Fixed offsets; check daylight saving and dates. No booking or dispatch is
                  confirmed.
                </small>
              </label>
            )}
            <div className="callout">
              <ShieldCheck size={20} />
              <span>
                {business.mode === 'trial'
                  ? 'Trial: approvals are recorded without changing business operations.'
                  : 'Live: approved actions are recorded in the Gluons ledger. No external scheduling, dispatch or payment service is connected.'}
              </span>
            </div>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <Button disabled={!!busy || !enabled.includes(selected.service)} type="submit">
              <Play size={16} />
              {busy === 'stage' ? 'Preparing…' : 'Prepare for review'}
              <ArrowRight size={16} />
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
