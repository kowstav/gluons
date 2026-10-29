'use client';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Coins,
  FileText,
  Layers3,
  PackageCheck,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { savings } from '@gluons/runtime/client';
import type { PanelProps } from '@/lib/client';
import { Badge, Button, Card, cost, money, relative } from './ui';
import { serviceCopy } from '@/lib/service-copy';
export function Overview({
  data,
  business,
  navigate,
  onSimulate,
}: PanelProps & { onSimulate: () => void }) {
  const [days, setDays] = useState(30);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const stats = savings(data.state, business.id, since);
  const tasks = data.state.tasks.filter(
    (t) => t.businessId === business.id && t.createdAt >= since,
  );
  const pending = data.state.actions.filter(
    (a) => a.businessId === business.id && a.status === 'pending',
  );
  const integration = data.state.integrations.find((i) => i.businessId === business.id);
  const serviceName = (taskId: string) => {
    const task = data.state.tasks.find((t) => t.id === taskId);
    return task ? serviceCopy[task.componentId].name : 'Business task';
  };
  const chart = Array.from({ length: Math.min(days, 18) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (Math.min(days, 18) - 1 - i));
    const day = date.toISOString().slice(0, 10);
    const dayTasks = tasks.filter((t) => t.createdAt.startsWith(day));
    const ids = new Set(dayTasks.map((t) => t.id));
    const completed = data.state.actions.filter(
      (a) => ids.has(a.taskId) && ['simulated', 'executed'].includes(a.status),
    );
    const hours =
      completed.reduce(
        (sum, a) =>
          sum +
          (dayTasks.find((t) => t.id === a.taskId)?.humanMinutes ?? 0) -
          business.baseline.reviewMinutesPerTask,
        0,
      ) / 60;
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      staff: Math.max(0, hours) * stats.hourlyRate,
      ai: dayTasks.reduce((sum, t) => sum + t.costUsd, 0),
    };
  });
  const tierCounts = ['cheap', 'medium', 'frontier'].map((tier) => ({
    tier,
    count: tasks.filter((t) => t.attempts.at(-1)?.tier === tier).length,
  }));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-spark">✳</span> A LITTLE LESS BUSY. A LOT MORE POSSIBLE.
          </div>
          <h1>
            More time for what matters<span className="orange-text">.</span>
          </h1>
          <p>Here’s the space Gluons is making for {business.name}.</p>
        </div>
        <div className="heading-actions">
          <Button variant="outline" onClick={() => navigate('report')}>
            <ArrowDownToLine size={15} /> Trial report
          </Button>
          <Button onClick={onSimulate}>
            <Plus size={17} /> {data.aiMode === 'demo' ? 'Run demo task' : 'New AI task'}
          </Button>
        </div>
      </div>
      <div className="section-toolbar">
        <div className="button-row">
          <h2>Your business, at a glance</h2>
          <Badge>Estimated savings</Badge>
        </div>
        <label className="date-select">
          <span className="sr-only">Overview date range</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={30}>Last 30 days</option>
            <option value={7}>Last 7 days</option>
          </select>
        </label>
      </div>
      <div className="metric-grid">
        <Card className="metric metric-highlight">
          <div className="metric-top">
            Time given back{' '}
            <span className="metric-icon">
              <Clock3 size={18} />
            </span>
          </div>
          <div className="metric-value">
            {stats.hours.toFixed(1)}
            <span>hrs</span>
          </div>
          <div className="metric-foot">
            <span>
              <ArrowUpRight size={13} />
              {stats.completed} completed tasks
            </span>
            <small>after owner review</small>
          </div>
          <div className="metric-decoration" />
        </Card>
        <Card className="metric">
          <div className="metric-top">
            Equivalent staff cost{' '}
            <span className="metric-icon">
              <Coins size={18} />
            </span>
          </div>
          <div className="metric-value">{money(stats.equivalentStaffCost, 0)}</div>
          <div className="metric-foot">
            <span className="muted">{money(stats.hourlyRate)}/hr baseline</span>
            <small>time value, not cash saved</small>
          </div>
        </Card>
        <Card className="metric">
          <div className="metric-top">
            AI cost{' '}
            <span className="metric-icon">
              <Zap size={18} />
            </span>
          </div>
          <div className="metric-value">{money(stats.aiCost)}</div>
          <div className="metric-foot">
            <span className="green-text">
              <ArrowDown size={13} /> Usage for these tasks
            </span>
            <small>estimated token cost</small>
          </div>
        </Card>
        <Card className="metric">
          <div className="metric-top">
            Approval rate{' '}
            <span className="metric-icon">
              <ShieldCheck size={18} />
            </span>
          </div>
          <div className="metric-value">
            {stats.approvalRate.toFixed(1)}
            <span>%</span>
          </div>
          <div className="metric-foot">
            <span className="muted">You’re always in control</span>
            <small>{pending.length} waiting for review</small>
          </div>
        </Card>
      </div>
      <div className="overview-middle">
        <Card className="savings-chart">
          <div className="card-heading">
            <div>
              <h2>A little help. A visible difference.</h2>
              <p>The value of time returned, day by day.</p>
            </div>
            <span className="chart-total">
              {money(stats.netSavings, 0)}
              <small>estimated net value</small>
            </span>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-orange" /> Equivalent staff cost
            </span>
            <span>
              <i className="legend-green" /> AI cost
            </span>
          </div>
          <div
            className="chart-container"
            role="img"
            aria-label="Daily equivalent staff cost compared with estimated AI cost"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chart} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2855d9" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2855d9" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e1e7f0" strokeDasharray="3 5" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#53647c' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={(n) => `$${n}`}
                  tick={{ fontSize: 12, fill: '#53647c' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [
                    money(Number(value)),
                    name === 'staff' ? 'Equivalent staff cost' : 'AI cost',
                  ]}
                  contentStyle={{ border: '1px solid #e5e8df', borderRadius: 12, fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="staff"
                  stroke="#2855d9"
                  strokeWidth={2.5}
                  fill="url(#savingsFill)"
                />
                <Area
                  type="monotone"
                  dataKey="ai"
                  stroke="#176b55"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-note">
            <span>
              <TrendingUp size={15} /> Built from completed task estimates and your staff baseline.
            </span>
            <button onClick={() => navigate('report')}>
              See the calculation <ArrowUpRight size={13} />
            </button>
          </div>
        </Card>
        <Card className="routing-card">
          <div className="card-heading">
            <div className="button-row">
              <span className="orange-icon">
                <Zap size={17} />
              </span>
              <h2>Your activity, made clear</h2>
            </div>
            <Badge tone="green">Usage</Badge>
          </div>
          <p>See how requests were handled and review the estimated AI usage cost.</p>
          <div className="routing-visual">
            <div className="routing-core">
              <Zap size={27} />
            </div>
            <span className="routing-satellite satellite-one">✳</span>
            <span className="routing-satellite satellite-two">✦</span>
            <span className="routing-satellite satellite-three">●</span>
            <span className="routing-line one" />
            <span className="routing-line two" />
            <span className="routing-line three" />
          </div>
          <div className="model-distribution">
            {tierCounts.map(({ tier, count }) => (
              <span
                key={tier}
                className={`distribution-${tier}`}
                style={{ flex: Math.max(count, 1) }}
                title={`${tier}: ${count} tasks`}
              />
            ))}
          </div>
          <div className="model-labels">
            {tierCounts.map(({ tier, count }) => (
              <div key={tier}>
                <span className={`tier-dot tier-${tier}`} />
                <span>
                  {tier === 'cheap'
                    ? 'Routine'
                    : tier === 'medium'
                      ? 'Additional review'
                      : 'Complex'}
                </span>
                <strong>{tasks.length ? Math.round((count / tasks.length) * 100) : 0}%</strong>
              </div>
            ))}
          </div>
          <button className="text-link" onClick={() => navigate('activity')}>
            Explore your AI activity <ArrowRight size={15} />
          </button>
        </Card>
      </div>
      <div className="overview-bottom">
        <Card className="queue-preview">
          <div className="card-heading">
            <div className="button-row">
              <h2>A quick look, then your call</h2>
              <span className="count-pill">{pending.length}</span>
            </div>
            <button className="text-link" onClick={() => navigate('approvals')}>
              View queue <ArrowRight size={14} />
            </button>
          </div>
          {pending.length === 0 ? (
            <div className="small-empty">
              <Check size={24} />
              <p>All caught up. Enjoy the breathing room.</p>
            </div>
          ) : (
            pending.slice(0, 3).map((action) => (
              <button
                key={action.id}
                className="preview-action"
                onClick={() => navigate('approvals')}
              >
                <span className={`action-icon kind-${action.kind}`}>
                  {action.kind === 'create_order' ? (
                    <PackageCheck size={19} />
                  ) : action.kind === 'stock_alert' ? (
                    <Layers3 size={19} />
                  ) : (
                    <FileText size={19} />
                  )}
                </span>
                <span className="preview-action-copy">
                  <strong>{action.summary}</strong>
                  <small>
                    {serviceName(action.taskId)} <i>·</i> {relative(action.createdAt)}
                  </small>
                </span>
                <Badge tone={action.risk === 'medium' ? 'orange' : 'neutral'}>
                  {action.mode === 'trial' ? 'Trial' : 'Live'}
                </Badge>
                <ArrowUpRight size={15} />
              </button>
            ))
          )}
        </Card>
        <Card className="integration-summary">
          <div className="card-heading">
            <h2>Help for your day</h2>
            <span className="soft-icon">
              <Layers3 size={19} />
            </span>
          </div>
          <p>
            {integration?.componentIds.length ?? 0} services enabled for {business.name}.
          </p>
          <div className="integration-chain">
            <span className="chain-item">
              <Phone size={18} />
            </span>
            <i />
            <span className="chain-item orange">
              <PackageCheck size={18} />
            </span>
            <i />
            <span className="chain-item green">
              <Layers3 size={18} />
            </span>
          </div>
          <div className="chain-labels">
            <span>Customer calls</span>
            <span>Orders</span>
            <span>Stock alerts</span>
          </div>
          <div className="reuse-info">
            <strong>Every action</strong>
            <span>waits for your review</span>
            <Badge tone="green">You’re in control</Badge>
          </div>
          <button className="text-link" onClick={() => navigate('library')}>
            View your services <ArrowRight size={15} />
          </button>
        </Card>
      </div>
      <div className="trial-strip">
        <div className="trial-strip-icon">
          <FlaskConicalIcon />
        </div>
        <div>
          <strong>Try it alongside your everyday business.</strong>
          <p>Trial approvals are recorded for comparison. Your business keeps working as usual.</p>
        </div>
        <button className="text-link" onClick={() => navigate('report')}>
          Open trial report <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
function FlaskConicalIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M9 3h6m-5 0v6l-6 10a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M7 15h10" />
    </svg>
  );
}
