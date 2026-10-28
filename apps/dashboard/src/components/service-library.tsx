'use client';
import { useState } from 'react';
import {
  ArrowRight,
  Check,
  FileText,
  Layers3,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
} from 'lucide-react';
import type { ComponentId } from '@gluons/runtime/client';
import type { PanelProps } from '@/lib/client';
import { businessTypeCopy, serviceCopy } from '@/lib/service-copy';
import { Badge, Button, Card } from './ui';

const icons: Record<ComponentId, typeof Phone> = {
  'phone-agent': Phone,
  'order-taker': ShoppingBag,
  'stock-monitor': Package,
  ledger: FileText,
  'customer-service': Sparkles,
  'daily-report': Layers3,
};

export function Library({ data, business, navigate }: PanelProps) {
  const [query, setQuery] = useState('');
  const enabled =
    data.state.integrations.find((i) => i.businessId === business.id)?.componentIds ?? [];
  const services = data.components.filter((c) =>
    `${serviceCopy[c.id].name} ${serviceCopy[c.id].description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">HELP WITH YOUR EVERYDAY WORK</div>
          <h1>
            Choose the help you need<span className="orange-text">.</span>
          </h1>
          <p>
            See the services enabled for {business.name} and explore what else Gluons can help with.
          </p>
        </div>
        <Button onClick={() => navigate('builder')}>
          <Plus size={16} /> Set up a business
        </Button>
      </div>
      <div className="approval-summary">
        <ShieldCheck size={21} />
        <span>
          <strong>Start with the work that takes your time.</strong> Every proposed action comes to
          you for review. You can approve, edit or reject it.
        </span>
      </div>
      <div className="section-toolbar">
        <h2>{enabled.length} services enabled</h2>
        <label className="search-box">
          <Search size={16} />
          <input
            placeholder="Find a service"
            aria-label="Search services"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="library-grid">
        {services.map((c) => {
          const Icon = icons[c.id];
          const copy = serviceCopy[c.id];
          const active = enabled.includes(c.id);
          return (
            <Card key={c.id} className="component-card">
              <div className="card-heading">
                <span className={`component-icon component-${c.id}`}>
                  <Icon size={23} />
                </span>
                <Badge tone={active ? 'green' : 'neutral'}>
                  {active ? 'Enabled' : 'Available'}
                </Badge>
              </div>
              <h3>{copy.name}</h3>
              <p>{copy.description}</p>
              <div className="component-card-footer">
                <span>
                  <ShieldCheck size={13} /> Your approval required
                </span>
              </div>
              {active && (
                <div className="component-active">
                  <Check size={12} /> Enabled for {business.name}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {services.length === 0 && (
        <Card className="small-empty">
          <Search size={24} />
          <p>No matching services. Try a different search.</p>
        </Card>
      )}
      <div className="section-label">
        <h2>Set up for your kind of business</h2>
      </div>
      <div className="sector-grid">
        {data.sectorPacks.map((pack) => {
          const copy = businessTypeCopy[pack.id];
          return (
            <Card key={pack.id} className={`sector-card sector-${pack.color}`}>
              <div className="sector-card-heading">
                <span className="sector-illustration">
                  {pack.id === 'food-vendor' ? <Utensils size={34} /> : <ShoppingBag size={34} />}
                </span>
                <div>
                  <h3>{copy.name}</h3>
                  <p>{copy.description}</p>
                </div>
              </div>
              <div className="sector-component-list">
                {pack.uses.map((id) => (
                  <span key={id}>
                    <Check size={12} />
                    {serviceCopy[id].name}
                  </span>
                ))}
              </div>
              <div className="sector-footer">
                <span>Your catalog, hours and preferences</span>
                <Button size="sm" variant="outline" onClick={() => navigate('builder', pack.id)}>
                  Use this setup <ArrowRight size={14} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="activity-log-note">
        The demo includes these business types. We’ll confirm your requirements before a live setup.
      </p>
    </>
  );
}
