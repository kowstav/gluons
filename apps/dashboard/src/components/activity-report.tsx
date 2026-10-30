'use client';
import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  FlaskConical,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react';
import { savings, type Task } from '@gluons/runtime/client';
import { api, browserSupabase, type PanelProps } from '@/lib/client';
import { serviceCopy } from '@/lib/service-copy';
import { Badge, Button, Card, cost, Dialog, money, relative } from './ui';
export function Activity({ data, business }: PanelProps) {
  const [query, setQuery] = useState(''),
    [tier, setTier] = useState('all'),
    [selected, setSelected] = useState<Task | null>(null);
  const all = data.state.tasks.filter((t) => t.businessId === business.id);
  const tasks = all.filter(
    (t) =>
      (tier === 'all' || (tier === 'escalated' ? t.escalated : t.attempts.at(-1)?.tier === tier)) &&
      `${t.input} ${t.componentId} ${t.model}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A CLEAR RECORD OF YOUR WORK</div>
          <h1>
            See how your work was handled<span className="orange-text">.</span>
          </h1>
          <p>Review each request, its checks and the estimated AI usage cost in one place.</p>
        </div>
        <Badge tone="green">
          <Zap size={13} /> Usage details
        </Badge>
      </div>
      <div className="activity-process">
        <span>
          <i>1</i> Request received
        </span>
        <ArrowRight size={16} />
        <span>
          <i>2</i> Request assessed
        </span>
        <ArrowRight size={16} />
        <span>
          <i>3</i> Response prepared
        </span>
        <ArrowRight size={16} />
        <span>
          <i>4</i> Details checked
        </span>
        <ArrowRight size={16} />
        <span>
          <i>5</i> Your approval
        </span>
      </div>
      <div className="activity-stats">
        <Card>
          <small>Requests handled</small>
          <strong>{all.length}</strong>
        </Card>
        <Card>
          <small>Extra checks</small>
          <strong>{all.filter((t) => t.escalated).length}</strong>
        </Card>
        <Card>
          <small>Average processing</small>
          <strong>
            {all.length
              ? (all.reduce((s, t) => s + t.durationMs, 0) / all.length / 1000).toFixed(2)
              : '0'}
            <span>s</span>
          </strong>
        </Card>
        <Card>
          <small>Estimated total AI cost</small>
          <strong>{money(all.reduce((s, t) => s + t.costUsd, 0))}</strong>
        </Card>
      </div>
      <div className="section-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requests or services"
            aria-label="Search AI tasks"
          />
        </label>
        <label className="date-select">
          <span className="sr-only">Filter by model tier</span>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="all">All requests</option>
            <option value="cheap">Routine requests</option>
            <option value="medium">Additional review</option>
            <option value="frontier">Complex requests</option>
            <option value="escalated">Extra checks</option>
          </select>
        </label>
      </div>
      <Card className="activity-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request / service</th>
              <th>Assessment</th>
              <th>AI used</th>
              <th>Est. cost</th>
              <th>Output</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tasks.slice(0, 80).map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelected(t)}
                tabIndex={0}
                role="button"
                aria-label={`View task ${t.input}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(t);
                  }
                }}
              >
                <td>
                  <strong>{t.input}</strong>
                  <small>
                    {serviceCopy[t.componentId].name} · {relative(t.createdAt)}
                  </small>
                </td>
                <td>
                  <Badge
                    tone={
                      t.decision.difficulty === 'hard'
                        ? 'purple'
                        : t.decision.difficulty === 'moderate'
                          ? 'orange'
                          : 'green'
                    }
                  >
                    {t.decision.difficulty}
                  </Badge>
                  <small>
                    {t.decision.engine === 'demo-rules' ? 'Simulated decision' : 'Jev decision'}
                  </small>
                </td>
                <td>
                  <span className="model-name">{t.model.replace('anthropic/', '')}</span>
                  <small>
                    {t.provider === 'demo' ? 'Demo usage' : 'Gateway usage'}
                    {t.escalated ? ' · Escalated' : ''}
                  </small>
                </td>
                <td className="monospace">{cost(t.costUsd)}</td>
                <td>
                  <Badge tone={t.status === 'failed' ? 'red' : 'green'}>
                    {t.status === 'failed'
                      ? 'Failed'
                      : t.escalated
                        ? 'Escalated & checked'
                        : 'Checked'}
                  </Badge>
                </td>
                <td>
                  <ArrowUpRight size={15} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="small-empty">
            <Search size={24} />
            <p>No matching tasks.</p>
          </div>
        )}
      </Card>
      <p className="activity-log-note">
        Showing {Math.min(tasks.length, 80)} of {tasks.length} matching tasks. Includes request
        checks and all completed AI attempts. Usage costs are estimated using rates from{' '}
        {data.pricingDate}.
      </p>
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title="How this request was handled"
        wide
      >
        {selected && (
          <div className="task-detail">
            <Badge tone={selected.provider === 'demo' ? 'orange' : 'green'}>
              {selected.provider === 'demo'
                ? 'Simulated AI · illustrative usage'
                : 'Live AI Gateway'}
            </Badge>
            <h3>{selected.input}</h3>
            {selected.preparation && (
              <div className="callout">
                <div>
                  <strong>Source preparation: {selected.preparation.engines.join(', ')}</strong>
                  <p>
                    {selected.preparation.durationMs} ms of local parsing. AI usage below is tracked
                    separately.
                  </p>
                  <p>{selected.preparation.warnings.join(' ')}</p>
                  <small>Source SHA-256: {selected.preparation.sourceSha256}</small>
                </div>
              </div>
            )}
            <div className="decision-detail">
              <span className="orange-icon">
                <Zap size={19} />
              </span>
              <div>
                <strong>
                  {selected.decision.engine === 'demo-rules'
                    ? 'Jev decision · demo simulation'
                    : 'Jev decision'}
                </strong>
                <p>{selected.decision.reason}</p>
                {selected.decision.stockAlert !== undefined && (
                  <p>
                    Jev stock-alert decision:{' '}
                    {selected.decision.stockAlert
                      ? 'Alert warranted'
                      : 'Owner attention: decision disagrees with stock rules'}
                    . Business thresholds remain authoritative.
                  </p>
                )}
                <small>
                  {selected.decision.inputTokens} input tokens · {cost(selected.decision.costUsd)}{' '}
                  estimated
                </small>
              </div>
            </div>
            <h4>Model attempts</h4>
            {selected.attempts.map((a, i) => (
              <div className="attempt" key={i}>
                <span className={`attempt-number ${a.valid ? 'valid' : 'invalid'}`}>
                  {a.valid ? <Check size={15} /> : i + 1}
                </span>
                <div>
                  <strong>{a.model}</strong>
                  <p>
                    {a.valid
                      ? 'Output passed schema, component and business-fact checks.'
                      : a.error}
                  </p>
                  <small>
                    {a.inputTokens} input + {a.outputTokens} output tokens · {cost(a.costUsd)}{' '}
                    estimated
                  </small>
                </div>
                <Badge tone={a.valid ? 'green' : 'red'}>{a.valid ? 'Passed' : 'Escalated'}</Badge>
              </div>
            ))}
            {selected.error && <p className="inline-error">{selected.error}</p>}
            <div className="callout">
              <ShieldCheck size={18} />
              <span>
                Passing output checks never grants permission to act. Owner approval is still
                required.
              </span>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
export function Report({ data, business, toast, navigate }: PanelProps) {
  const [range, setRange] = useState(30),
    [busy, setBusy] = useState(false);
  const since = new Date(Date.now() - range * 86400000).toISOString();
  const stats = savings(data.state, business.id, since);
  const businessTasks = data.state.tasks.filter(
    (t) => t.businessId === business.id && t.createdAt >= since,
  );
  async function exportPdf() {
    setBusy(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.setDrawColor('#2855d9');
      pdf.setLineWidth(0.7);
      pdf.line(20, 12, 190, 12);
      let y = 22;
      const line = (text: string, size = 11) => {
        pdf.setFont('helvetica', size >= 15 ? 'bold' : 'normal');
        pdf.setFontSize(size);
        const lines = pdf.splitTextToSize(text, 170);
        if (y + lines.length * size * 0.4 > 275) {
          pdf.addPage();
          y = 22;
        }
        pdf.text(lines, 20, y);
        y += lines.length * size * 0.4 + 2.5;
      };
      pdf.setTextColor('#172b4d');
      line('gluons. / Trial comparison', 25);
      line(business.name, 17);
      line(`Generated ${new Date().toISOString().slice(0, 10)} | Last ${range} days`);
      line(
        'ESTIMATED - synthetic demo history is included. No cash savings or staff reductions are claimed.',
        10,
      );
      y += 4;
      const rows = [
        ['Tasks processed', String(stats.total)],
        ['Completed trial / live tasks', `${stats.simulated} / ${stats.executed}`],
        ['Gross task time', `${stats.grossHours.toFixed(2)} hours`],
        ['Estimated owner review time', `${stats.reviewHours.toFixed(2)} hours`],
        ['Estimated net time returned', `${stats.hours.toFixed(2)} hours`],
        ['Equivalent staff time value', money(stats.equivalentStaffCost)],
        ['Estimated model cost (USD)', money(stats.aiCost, 4)],
        ['Estimated net time value', money(stats.netSavings)],
        ['Approval rate', `${stats.approvalRate.toFixed(1)}%`],
      ];
      rows.forEach(([k, v]) => line(`${k}: ${v}`));
      y += 4;
      line('Calculation & assumptions', 15);
      line(
        `Staff baseline: ${money(business.baseline.monthlyStaffCost)} / ${business.baseline.monthlyStaffHours} hours per month = ${money(stats.hourlyRate)} per hour. Owner review: ${business.baseline.reviewMinutesPerTask} minutes per reviewed proposal.`,
      );
      line(
        'Net time returned = max(0, completed tasks x service time estimate - owner review time). Trial approvals represent potential savings; executed local operations are tracked separately. Pending and rejected proposals earn no gross time savings. All processed tasks count toward AI cost.',
      );
      line(
        `Model pricing snapshot: ${data.pricingDate}. Costs use token usage and configured rates. Demo token usage is synthetic. Twilio, Vapi, hosting, taxes and other vendor fees are excluded.`,
      );
      if (y + 62 > 275) {
        pdf.addPage();
        y = 22;
      }
      line('Results by service', 15);
      data.components.forEach((c) => {
        const ids = new Set(businessTasks.filter((t) => t.componentId === c.id).map((t) => t.id));
        line(
          `${serviceCopy[c.id].name}: ${ids.size} tasks; ${c.human_minutes_per_task} estimated human minutes per completed task.`,
        );
      });
      line(
        'This report is a prototype comparison, not an invoice or a realized savings guarantee.',
        10,
      );
      for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
        pdf.setPage(page);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor('#53647c');
        pdf.text('Gluons | Estimated trial comparison', 20, 289);
        pdf.text(`${page} / ${pdf.getNumberOfPages()}`, 190, 289, { align: 'right' });
      }
      pdf.save(`gluons-trial-${business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
      toast('Trial comparison downloaded as PDF.');
    } catch {
      toast('The PDF could not be generated. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">TRY IT. MEASURE IT. THEN DECIDE.</div>
          <h1>
            A clearer picture of the difference<span className="orange-text">.</span>
          </h1>
          <p>Your business keeps running. Gluons shows what could change.</p>
        </div>
        <Button onClick={exportPdf} disabled={busy}>
          <ArrowDownToLine size={16} />
          {busy ? 'Preparing PDF…' : 'Export PDF report'}
        </Button>
      </div>
      <div className="report-cover">
        <div>
          <Badge tone="orange">
            <FlaskConical size={13} /> Trial comparison · Estimated
          </Badge>
          <h2>{business.name}</h2>
          <p>More room in your day. Measured with your numbers.</p>
        </div>
        <label className="date-select">
          <span className="sr-only">Trial report date range</span>
          <select value={range} onChange={(e) => setRange(Number(e.target.value))}>
            <option value={30}>Last 30 days</option>
            <option value={7}>Last 7 days</option>
          </select>
        </label>
      </div>
      <div className="report-comparison">
        <Card>
          <div className="eyebrow">THE SAME TASKS, BY HAND</div>
          <h3>Without Gluons</h3>
          <div className="report-big">
            {stats.grossHours.toFixed(1)}
            <span>staff hours</span>
          </div>
          <p>{money(stats.grossHours * stats.hourlyRate)} equivalent staff time</p>
          <div className="comparison-bar baseline" />
          <small>{stats.completed} completed tasks × time estimates for each service</small>
        </Card>
        <div className="comparison-arrow">
          <ArrowRight size={23} />
        </div>
        <Card className="report-after">
          <div className="eyebrow">A LITTLE HELP ALONG THE WAY</div>
          <h3>With Gluons</h3>
          <div className="report-big">
            {stats.reviewHours.toFixed(1)}
            <span>review hours</span>
          </div>
          <p>
            {money(stats.reviewHours * stats.hourlyRate)} review time + {money(stats.aiCost)} AI
          </p>
          <div className="comparison-bar">
            <i
              style={{
                width: `${stats.grossHours ? Math.min(100, (stats.reviewHours / stats.grossHours) * 100) : 0}%`,
              }}
            />
          </div>
          <small>
            {business.baseline.reviewMinutesPerTask} minute review allowance per decision
          </small>
        </Card>
      </div>
      <div className="report-results">
        <div>
          <Clock3 size={23} />
          <strong>{stats.hours.toFixed(1)} hrs</strong>
          <span>estimated time returned</span>
        </div>
        <div>
          <Sparkles size={23} />
          <strong>{money(stats.netSavings, 0)}</strong>
          <span>estimated net time value</span>
        </div>
        <div>
          <ShieldCheck size={23} />
          <strong>
            {stats.simulated} / {stats.executed}
          </strong>
          <span>trial outcomes / live operations</span>
        </div>
      </div>
      <Card className="methodology">
        <h2>Clear numbers. Clear assumptions.</h2>
        <div className="method-grid">
          <div>
            <h3>Your baseline</h3>
            <p>
              {money(business.baseline.monthlyStaffCost)} monthly staff cost ÷{' '}
              {business.baseline.monthlyStaffHours} staff hours ={' '}
              <strong>{money(stats.hourlyRate)}/hour</strong>.
            </p>
            <button className="text-link" onClick={() => navigate('settings')}>
              Update baseline <ArrowUpRight size={13} />
            </button>
          </div>
          <div>
            <h3>Time returned</h3>
            <p>
              Completed task time estimates minus review time. Pending or rejected actions add no
              gross savings. Rejected decisions still count toward review time.
            </p>
          </div>
          <div>
            <h3>Costs included</h3>
            <p>
              Jev and completed model attempts at configured token rates. Excludes voice, messaging,
              hosting, taxes and subscription fees.
            </p>
          </div>
          <div>
            <h3>What trial means</h3>
            <p>
              Approved trial proposals are recorded, without performing operations. Savings
              represent potential staff time value. Synthetic demo history is illustrative.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
export function SettingsPanel({ data, business, refresh, toast }: PanelProps) {
  const [staffCost, setStaffCost] = useState(business.baseline.monthlyStaffCost),
    [hours, setHours] = useState(business.baseline.monthlyStaffHours),
    [review, setReview] = useState(business.baseline.reviewMinutesPerTask),
    [mode, setMode] = useState(business.mode),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/settings', 'PATCH', {
        businessId: business.id,
        mode,
        baseline: {
          monthlyStaffCost: staffCost,
          monthlyStaffHours: hours,
          reviewMinutesPerTask: review,
        },
      });
      await refresh();
      toast('Business settings saved. New proposals will use the selected mode.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const connections = [
    ['supabase', 'Supabase', 'Database, sign-in and live workspace updates'],
    ['gateway', 'AI Gateway + Jev', 'Typed decisions and tiered working models'],
    ['twilio', 'Twilio WhatsApp', 'Inbound messages and approved outbound replies'],
    ['vapi', 'Vapi voice', 'Authenticated end-of-call transcript intake'],
    ['langfuse', 'Langfuse', 'Task traces, model usage and estimated cost'],
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR BUSINESS, YOUR WAY</div>
          <h1>
            Good defaults. Your controls<span className="orange-text">.</span>
          </h1>
          <p>Set the baseline, choose the mode, and connect the services you need.</p>
        </div>
        {data.storage === 'supabase' && (
          <Button
            variant="outline"
            onClick={async () => {
              await browserSupabase()?.auth.signOut();
              window.location.href = '/login';
            }}
          >
            Sign out
          </Button>
        )}
      </div>
      <div className="settings-grid">
        <Card className="settings-card">
          <h2>Business baseline & mode</h2>
          <p className="muted">These numbers shape your estimated savings.</p>
          <form onSubmit={save} className="form-stack">
            <label>
              Monthly staff cost ($)
              <input
                type="number"
                min="0"
                max="1000000"
                value={staffCost}
                onChange={(e) => setStaffCost(Number(e.target.value))}
                required
              />
            </label>
            <label>
              Monthly staff hours
              <input
                type="number"
                min="1"
                max="20000"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                required
              />
            </label>
            <label>
              Owner review minutes per proposal
              <input
                type="number"
                min="0"
                max="120"
                step="0.1"
                value={review}
                onChange={(e) => setReview(Number(e.target.value))}
                required
              />
            </label>
            <label>
              Operating mode
              <select value={mode} onChange={(e) => setMode(e.target.value as 'trial' | 'live')}>
                <option value="trial">Trial — record approved outcomes</option>
                <option value="live">Live — apply approved operations</option>
              </select>
            </label>
            <div className="callout">
              <ShieldCheck size={18} />
              <span>
                {mode === 'trial'
                  ? 'Approved actions are recorded without changing business operations.'
                  : 'Approved orders and ledger entries will update Gluons records. WhatsApp delivery also requires configured live credentials.'}{' '}
                Pending proposals keep the mode captured when they were staged.
              </span>
            </div>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save business settings'}
            </Button>
          </form>
        </Card>
        <div>
          <Card className="connections-card">
            <h2>Your connections</h2>
            <p className="muted">
              {data.storage === 'local'
                ? 'Running locally with a durable file store.'
                : 'Connected to your Supabase workspace.'}
            </p>
            {connections.map(([id, name, description]) => (
              <div className="connection-row" key={id}>
                <span className={`connection-status ${data.connections[id] ? 'ready' : ''}`} />
                <div>
                  <strong>{name}</strong>
                  <small>{description}</small>
                </div>
                <Badge tone={data.connections[id] ? 'green' : 'neutral'}>
                  {data.connections[id] ? 'Configured' : 'Not connected'}
                </Badge>
              </div>
            ))}
            <a
              className="text-link"
              href="https://github.com/kowstav/gluons/blob/main/docs/SETUP.md"
              target="_blank"
              rel="noreferrer"
            >
              Open connection setup guide <ExternalLink size={14} />
            </a>
          </Card>
          <Card className="settings-note">
            <ShieldCheck size={23} />
            <h3>Small permissions. Clear records.</h3>
            <p>
              Every decision leaves a record. Every task names its model. Every business operation
              waits for approval.
            </p>
            <span>
              AI mode:{' '}
              <strong>{data.aiMode === 'demo' ? 'Deterministic demo' : 'AI Gateway'}</strong>
            </span>
          </Card>
        </div>
      </div>
      <Card className="audit-card">
        <h2>Recent audit events</h2>
        {data.state.audit
          .filter((a) => a.businessId === business.id)
          .slice(0, 12)
          .map((a) => (
            <div key={a.id}>
              <Badge>{a.type.replaceAll('_', ' ')}</Badge>
              <p>
                {a.detail}
                <small>
                  {a.actor} · {relative(a.at)}
                </small>
              </p>
            </div>
          ))}
      </Card>
    </>
  );
}
