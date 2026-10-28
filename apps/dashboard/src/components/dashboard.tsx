'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { components, scenarioInput, type Business, type ComponentId } from '@gluons/runtime/client';
import { api, browserSupabase, type PanelProps, type WorkspaceResponse } from '@/lib/client';
import { Badge, Button, Dialog, Logo } from './ui';
import { Overview } from './overview';
import { Approvals } from './approvals';
import { Builder } from './library-builder';
import { Library } from './service-library';
import { serviceCopy } from '@/lib/service-copy';
import { Activity, Report, SettingsPanel } from './activity-report';

const navigation = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'approvals', name: 'Approval queue', icon: ListChecks },
  { id: 'activity', name: 'Activity & usage', icon: Zap },
  { id: 'library', name: 'Services', icon: BookOpen },
  { id: 'builder', name: 'Business setup', icon: Workflow },
  { id: 'report', name: 'Trial report', icon: FlaskConical },
];
export default function Dashboard() {
  const [data, setData] = useState<WorkspaceResponse | null>(null),
    [businessId, setBusinessId] = useState('business-morning-table'),
    [tab, setTab] = useState('overview'),
    [builderPack, setBuilderPack] = useState('food-vendor'),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [mobile, setMobile] = useState(false),
    [simulate, setSimulate] = useState(false),
    [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const result = await api<WorkspaceResponse>('/api/workspace');
      setData(result);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  const toast = useCallback((message: string) => {
    setNotice(message);
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    const client = browserSupabase();
    const channel = client
      ?.channel('workspace-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'workspaces' }, () =>
        refresh(),
      )
      .subscribe();
    return () => {
      clearInterval(timer);
      if (channel) client?.removeChannel(channel);
    };
  }, [refresh]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('tab');
    if (navigation.some((n) => n.id === q)) setTab(q!);
    const pack = new URLSearchParams(window.location.search).get('pack');
    if (pack === 'retail-shop' || pack === 'food-vendor') setBuilderPack(pack);
  }, []);
  const navigate = (id: string, packId?: string) => {
    if (packId) setBuilderPack(packId);
    setTab(id);
    setMobile(false);
    window.history.replaceState(
      null,
      '',
      `/dashboard${id === 'overview' ? '' : `?tab=${id}${packId ? `&pack=${packId}` : ''}`}`,
    );
  };
  const business =
    data?.state.businesses.find((b) => b.id === businessId) ?? data?.state.businesses[0];
  const pending =
    data?.state.actions.filter((a) => a.businessId === business?.id && a.status === 'pending')
      .length ?? 0;
  const panel = data && business ? { data, business, refresh, toast, navigate } : null;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
        <Link href="/" className="brand-link">
          <Logo />
        </Link>
        <button
          className="mobile-close"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <div className="workspace-label">
          WORKSPACE <span>01</span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? 'active' : ''}`}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {id === 'approvals' && pending > 0 && <span className="nav-count">{pending}</span>}
              {id === 'activity' && <span className="tiny-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="owner-control">
            <ShieldCheck size={20} />
            <strong>
              Your business.
              <br />
              Your final say.
            </strong>
            <p>Every action waits for you.</p>
            <span>
              <span className="status-dot" /> Approval required
            </span>
          </div>
          <button
            className={`nav-item ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => navigate('settings')}
          >
            <Settings size={18} />
            <span>Settings & connections</span>
          </button>
          <a className="nav-item" href="/#how-it-works">
            <CircleHelp size={18} />
            <span>Getting started</span>
            <ArrowUpRight size={14} />
          </a>
          <div className="sidebar-person">
            <span className="avatar">
              {business?.ownerName
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('') ?? 'AM'}
            </span>
            <div>
              <strong>{business?.ownerName ?? 'Workspace owner'}</strong>
              <small>Business owner</small>
            </div>
            <ChevronDown size={14} />
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </Button>
            <span className="business-icon">
              M<span>↗</span>
            </span>
            <label className="business-select">
              <span className="sr-only">Select business</span>
              <select value={business?.id ?? ''} onChange={(e) => setBusinessId(e.target.value)}>
                {data?.state.businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="topbar-divider" />
            <Badge tone={business?.mode === 'trial' ? 'orange' : 'green'}>
              {business?.mode === 'trial' ? <FlaskConical size={12} /> : <ShieldCheck size={12} />}{' '}
              {business?.mode === 'trial' ? 'Trial workspace' : 'Live operations'}
            </Badge>
          </div>
          <div className="topbar-right">
            <span className="connected">
              <span className="status-dot" />
              {data?.storage === 'supabase' ? 'Live sync' : 'Local sync'}
            </span>
            <button
              className="notification-button"
              onClick={() => navigate('approvals')}
              aria-label={`${pending} pending approvals`}
            >
              <Bell size={19} />
              {pending > 0 && <i />}
            </button>
            <span className="avatar avatar-small">{business?.ownerName[0] ?? 'A'}</span>
          </div>
        </header>
        <main id="main" className="dashboard-main">
          {loading ? (
            <div className="loading-state">
              <span className="loading-orbit" />
              <p>Bringing your workspace together…</p>
            </div>
          ) : error && !data ? (
            <div className="empty-state">
              <ShieldCheck size={40} />
              <h1>Your workspace is ready when you are.</h1>
              <p>{error}</p>
              <div className="button-row">
                <Link href="/login" className="button button-primary">
                  Sign in
                </Link>
                <Button variant="outline" onClick={() => refresh()}>
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            panel && (
              <>
                <div className="demo-banner">
                  <span>
                    <FlaskConical size={15} />
                    {data?.aiMode === 'demo'
                      ? 'Demo workspace · Synthetic history and simulated AI. No paid model calls.'
                      : 'Live AI enabled · History marked “demo” is synthetic; model costs are estimates.'}
                  </span>
                  <button onClick={() => navigate('settings')}>
                    View connections <ArrowUpRight size={13} />
                  </button>
                </div>
                {error && (
                  <div className="inline-error" role="alert">
                    {error}
                  </div>
                )}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${tab}-${business?.id}`}
                    initial={{ opacity: 0, y: 7 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {tab === 'overview' ? (
                      <Overview {...panel} onSimulate={() => setSimulate(true)} />
                    ) : tab === 'approvals' ? (
                      <Approvals {...panel} />
                    ) : tab === 'activity' ? (
                      <Activity {...panel} />
                    ) : tab === 'library' ? (
                      <Library {...panel} />
                    ) : tab === 'builder' ? (
                      <Builder
                        initialPackId={builderPack}
                        {...panel}
                        onCreated={(id) => {
                          setBusinessId(id);
                          navigate('overview');
                        }}
                      />
                    ) : tab === 'report' ? (
                      <Report {...panel} />
                    ) : (
                      <SettingsPanel {...panel} />
                    )}
                  </motion.div>
                </AnimatePresence>
                <footer className="workspace-footer">
                  <span>
                    <span className="logo-mini">✳</span> Small tasks. More possibilities.
                  </span>
                  <span>
                    Powered by Gluons <i /> Owner approved, always.
                  </span>
                </footer>
              </>
            )
          )}
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <ShieldCheck size={18} />
          {notice}
          <button onClick={() => setNotice('')} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}
      {panel && <TaskDialog open={simulate} onClose={() => setSimulate(false)} {...panel} />}
    </div>
  );
}
function TaskDialog({
  open,
  onClose,
  business,
  data,
  refresh,
  toast,
  navigate,
}: PanelProps & { open: boolean; onClose: () => void }) {
  const [id, setId] = useState<ComponentId>('order-taker'),
    [text, setText] = useState(''),
    [item, setItem] = useState(''),
    [quantity, setQuantity] = useState(2),
    [amount, setAmount] = useState(48.5),
    [stock, setStock] = useState(''),
    [stockQuantity, setStockQuantity] = useState(0),
    [force, setForce] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const enabled =
    data.state.integrations.find((i) => i.businessId === business.id)?.componentIds ?? [];
  useEffect(() => {
    const selected = enabled.includes(id) ? id : (enabled[0] ?? 'order-taker');
    setId(selected);
    const scenario = scenarioInput(selected, business);
    setText(scenario.transcript);
    setItem(business.catalog[0]?.id ?? '');
    setStock(business.stock[0]?.id ?? '');
    setStockQuantity(Math.min(business.stock[0]?.quantity ?? 0, business.stock[0]?.threshold ?? 0));
    setError('');
  }, [open, id, business.id]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const input = {
        ...scenarioInput(id, business),
        transcript: text,
        ...(['order-taker', 'phone-agent'].includes(id) ? { catalogItemId: item, quantity } : {}),
        ...(id === 'ledger' ? { amount } : {}),
        ...(id === 'stock-monitor' ? { stockItemId: stock, stockQuantity } : {}),
        forceEscalation: force,
      };
      const result = await api<{ task: { status: string; error?: string } }>(
        '/api/tasks',
        'POST',
        input,
      );
      await refresh();
      if (result.task.status === 'failed') {
        setError(result.task.error ?? 'Task could not pass its output checks.');
        return;
      }
      toast('Task routed and staged. Your approval is the next step.');
      onClose();
      navigate('approvals');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={data.aiMode === 'demo' ? 'Run a demo task' : 'Run an AI task'}
    >
      <p className="muted dialog-intro">
        Try a sample request, review the proposed action, then decide.
      </p>
      <form onSubmit={submit} className="form-stack">
        <label>
          Service
          <select value={id} onChange={(e) => setId(e.target.value as ComponentId)}>
            {components
              .filter((c) => enabled.includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {serviceCopy[c.id].name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Customer request or task
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            required
            minLength={3}
          />
        </label>
        {['order-taker', 'phone-agent'].includes(id) && (
          <div className="form-grid">
            <label>
              Catalog item
              <select value={item} onChange={(e) => setItem(e.target.value)}>
                {business.catalog.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} · ${i.price}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max="1000"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </label>
          </div>
        )}
        {id === 'ledger' && (
          <label>
            Receipt amount ($)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </label>
        )}
        {id === 'stock-monitor' && (
          <div className="form-grid">
            <label>
              Stock item
              <select value={stock} onChange={(e) => setStock(e.target.value)}>
                {business.stock.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (threshold {s.threshold})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Current quantity
              <input
                type="number"
                min="0"
                step="0.01"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
              />
            </label>
          </div>
        )}
        {data.aiMode === 'demo' && (
          <label className="checkbox-label">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            Show how an extra check is handled (demo)
          </label>
        )}
        <div className="callout">
          <ShieldCheck size={17} />
          <span>
            {business.mode === 'trial'
              ? 'Trial mode: approving records the outcome without performing the operation.'
              : 'Live mode: approved actions update your operations ledger.'}
          </span>
        </div>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          <Sparkles size={16} />
          {busy ? 'Preparing your request…' : 'Prepare for review'}
        </Button>
      </form>
    </Dialog>
  );
}
