'use client';
import { useState } from 'react';
import {
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  FilePenLine,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { ProposedAction } from '@gluons/runtime';
import { api, type PanelProps } from '@/lib/client';
import { Badge, Button, Card, cost, Dialog, relative } from './ui';
export function Approvals({ data, business, refresh, toast, navigate }: PanelProps) {
  const [filter, setFilter] = useState('pending'),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState<ProposedAction | null>(null),
    [summary, setSummary] = useState(''),
    [details, setDetails] = useState(''),
    [editQuantity, setEditQuantity] = useState(1),
    [editAmount, setEditAmount] = useState(1),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  const all = data.state.actions.filter((a) => a.businessId === business.id);
  const actions = all.filter(
    (a) =>
      (filter === 'all' ||
        (filter === 'pending' ? a.status === 'pending' : a.status !== 'pending')) &&
      `${a.summary} ${a.details}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function decide(
    action: ProposedAction,
    decision: 'approve' | 'reject' | 'execute',
    edit?: { summary: string; details: string; quantity?: number; amount?: number },
  ) {
    setBusy(action.id);
    setError('');
    try {
      await api(`/api/actions/${action.id}`, 'POST', { decision, edit });
      await refresh();
      setSelected(null);
      toast(
        decision === 'reject'
          ? 'Proposal rejected. No operation performed.'
          : action.mode === 'trial'
            ? 'Approved and recorded in your trial report. No operation performed.'
            : 'Approved action applied.',
      );
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <div className="page-heading">
        <div className="heading-copy">
          <div className="eyebrow">THE FINAL SAY IS ALWAYS YOURS</div>
          <h1>
            Your approval queue<span className="orange-text">.</span>
          </h1>
          <p>Review the details. Make it yours. Decide what happens next.</p>
        </div>
        <Badge tone="green">
          <span className="status-dot" /> Updates automatically
        </Badge>
      </div>
      <div className="approval-summary">
        <ShieldCheck size={21} />
        <span>
          <strong>Every action stops here first.</strong>{' '}
          {business.mode === 'trial'
            ? 'You’re in trial mode. Approved proposals are recorded, without performing business operations.'
            : 'Live actions update your operations only after you approve them.'}
        </span>
      </div>
      <div className="section-toolbar">
        <div className="tabs" role="tablist" aria-label="Filter approval actions">
          {['pending', 'reviewed', 'all'].map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={filter === f ? 'selected' : ''}
              onClick={() => setFilter(f)}
            >
              {f === 'pending'
                ? 'Needs your review'
                : f === 'reviewed'
                  ? 'Reviewed'
                  : 'All actions'}{' '}
              <span>
                {f === 'pending'
                  ? all.filter((a) => a.status === 'pending').length
                  : f === 'reviewed'
                    ? all.filter((a) => a.status !== 'pending').length
                    : all.length}
              </span>
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search proposals"
            aria-label="Search proposals"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <div className="approval-list">
        {actions.slice(0, 60).map((action) => {
          const task = data.state.tasks.find((t) => t.id === action.taskId);
          const definition = data.components.find((c) => c.id === task?.componentId);
          return (
            <Card key={action.id} className="approval-card">
              <div className="approval-card-top">
                <div className="button-row">
                  <span className="action-icon">
                    <FilePenLine size={19} />
                  </span>
                  <div>
                    <h3>{action.summary}</h3>
                    <div className="action-meta">
                      {definition?.name} <i>·</i> {relative(action.createdAt)} <i>·</i>{' '}
                      {task?.trigger.replaceAll('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className="badge-row">
                  <Badge tone={action.mode === 'trial' ? 'orange' : 'green'}>
                    {action.mode === 'trial' ? 'Trial' : 'Live'}
                  </Badge>
                  <Badge
                    tone={
                      action.status === 'pending'
                        ? 'neutral'
                        : action.status === 'rejected'
                          ? 'red'
                          : 'green'
                    }
                  >
                    {action.status.replaceAll('_', ' ')}
                  </Badge>
                </div>
              </div>
              <p className="proposal-details">{action.details}</p>
              <div className="proposal-facts">
                {Object.entries(action.data)
                  .filter(([k]) => !['description', 'catalogItemId', 'stockItemId'].includes(k))
                  .map(([key, value]) => (
                    <span key={key}>
                      <small>{key.replaceAll(/([A-Z])/g, ' $1')}</small>
                      <strong>
                        {Array.isArray(value) ? value.join(', ') || 'None' : String(value)}
                      </strong>
                    </span>
                  ))}
              </div>
              <div className="approval-card-bottom">
                <div className="action-model">
                  <ZapSmall />
                  <span>{task?.model.split('/')[1] ?? 'Model unavailable'}</span>
                  <span>{cost(task?.costUsd ?? 0)} est.</span>
                  {task?.decision.needsHuman && <Badge tone="orange">Extra attention</Badge>}
                </div>
                {action.status === 'pending' ? (
                  <div className="button-row">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!!busy}
                      onClick={() => decide(action, 'reject')}
                    >
                      <X size={15} /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => {
                        setSelected(action);
                        setSummary(action.summary);
                        setDetails(action.details);
                        setEditQuantity(Number(action.data.quantity ?? 1));
                        setEditAmount(Number(action.data.amount ?? 1));
                      }}
                    >
                      <FilePenLine size={14} /> Edit
                    </Button>
                    <Button size="sm" disabled={!!busy} onClick={() => decide(action, 'approve')}>
                      <Check size={15} />
                      {busy === action.id ? 'Saving…' : 'Approve'}
                    </Button>
                  </div>
                ) : (
                  <div className="reviewed-by">
                    <CheckCheck size={15} />
                    {action.approvedBy ?? 'Owner'}
                    {action.edited && ' · Edited'}
                    {action.status === 'approved' && (
                      <Button size="sm" onClick={() => decide(action, 'execute')} disabled={!!busy}>
                        Run approved action
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {action.result && <div className="action-result">{action.result}</div>}
            </Card>
          );
        })}
        {actions.length === 0 && (
          <Card className="empty-state">
            <ShieldCheck size={40} />
            <h2>{query ? 'No matching proposals' : 'A little breathing room.'}</h2>
            <p>
              {query
                ? 'Try a different search.'
                : 'You’re all caught up. New proposals will appear here for your review.'}
            </p>
            <Button variant="outline" onClick={() => navigate('overview')}>
              Back to overview
            </Button>
          </Card>
        )}
      </div>
      {actions.length > 60 && (
        <p className="muted">
          Showing the latest 60 matching actions. The complete history remains in your report and
          audit log.
        </p>
      )}
      <Dialog open={!!selected} onClose={() => setSelected(null)} title="Make this proposal yours">
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (selected)
              decide(selected, 'approve', {
                summary,
                details,
                ...(selected.kind === 'create_order' ? { quantity: editQuantity } : {}),
                ...(selected.kind === 'ledger_entry' ? { amount: editAmount } : {}),
              });
          }}
        >
          <p className="muted">
            Edit the proposal before approval. Order totals are recalculated from your catalog
            price. Recipients stay fixed.
          </p>
          <label>
            Summary
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              minLength={5}
              maxLength={180}
            />
          </label>
          <label>
            Message or note
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={6}
              required
              minLength={5}
              maxLength={3000}
            />
          </label>
          {selected?.kind === 'create_order' && (
            <label>
              Order quantity
              <input
                type="number"
                min="1"
                max="1000"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number(e.target.value))}
                required
              />
            </label>
          )}
          {selected?.kind === 'ledger_entry' && (
            <label>
              Expense amount ($)
              <input
                type="number"
                min="0.01"
                step="0.01"
                max="1000000"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
                required
              />
            </label>
          )}
          {error && <p className="inline-error">{error}</p>}
          <Button type="submit" disabled={!!busy}>
            <Check size={16} />
            {busy ? 'Saving…' : 'Save edits & approve'}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
function ZapSmall() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m13 2-9 12h7l-1 8 10-12h-7z" />
    </svg>
  );
}
