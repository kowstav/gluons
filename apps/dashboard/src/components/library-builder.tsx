'use client';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  FileText,
  Layers3,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
  Workflow,
} from 'lucide-react';
import {
  type CatalogItem,
  type ComponentId,
  type SectorPack,
  type StockItem,
} from '@gluons/runtime/client';
import { api, type PanelProps } from '@/lib/client';
import { businessTypeCopy, serviceCopy } from '@/lib/service-copy';
import { Badge, Button, Card, money } from './ui';
const icons: Record<string, typeof Phone> = {
  'job-intake': Workflow,
  'job-sheet': FileText,
  'phone-agent': Phone,
  'order-taker': ShoppingBag,
  'stock-monitor': Package,
  ledger: FileText,
  'customer-service': Sparkles,
  'daily-report': Layers3,
};
export function Builder({
  data,
  refresh,
  toast,
  onCreated,
  initialPackId = 'food-vendor',
}: PanelProps & { onCreated: (id: string) => void; initialPackId?: string }) {
  const [step, setStep] = useState(1),
    [packId, setPackId] = useState(initialPackId),
    [selected, setSelected] = useState<ComponentId[]>(
      (data.sectorPacks.find((p) => p.id === initialPackId) ?? data.sectorPacks[0]).uses,
    ),
    [name, setName] = useState(''),
    [owner, setOwner] = useState(''),
    [phone, setPhone] = useState(''),
    [hours, setHours] = useState('Mon–Sat, 8 am–9 pm'),
    [staffCost, setStaffCost] = useState(3200),
    [staffHours, setStaffHours] = useState(208),
    [catalog, setCatalog] = useState<CatalogItem[]>([{ id: 'item-1', name: '', price: 9.5 }]),
    [stock, setStock] = useState<StockItem[]>([
      { id: 'stock-1', name: '', quantity: 18, threshold: 24, unit: 'pieces' },
    ]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const pack = data.sectorPacks.find((p) => p.id === packId)!;
  function choose(p: SectorPack) {
    setPackId(p.id);
    setSelected(p.uses);
  }
  async function deploy() {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ business: { id: string } }>('/api/integrations', 'POST', {
        name,
        ownerName: owner,
        sectorPackId: packId,
        componentIds: selected,
        phone,
        hours,
        monthlyStaffCost: staffCost,
        monthlyStaffHours: staffHours,
        catalog: catalog.map((item) => ({
          ...item,
          ingredients: Object.fromEntries(
            Object.entries(item.ingredients ?? {}).filter(([id]) =>
              stock.some((s) => s.id === id && s.name.trim()),
            ),
          ),
        })),
        stock: stock.filter((s) => s.name.trim()),
      });
      await refresh();
      toast(`${name} is ready with ${selected.length} services in trial mode.`);
      onCreated(result.business.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SET UP AROUND YOUR BUSINESS</div>
          <h1>
            Tell us about your business<span className="orange-text">.</span>
          </h1>
          <p>
            Choose the tasks you want help with, then add the details Gluons needs to prepare them.
          </p>
        </div>
        <Badge tone="green">
          <ShieldCheck size={13} /> Starts safely in trial mode
        </Badge>
      </div>
      <div className="builder-steps">
        {['Choose services', 'Business details', 'Review & start'].map((label, i) => (
          <div key={label} className={step >= i + 1 ? 'current' : ''}>
            <span>{step > i + 1 ? <Check size={15} /> : i + 1}</span>
            <strong>{label}</strong>
            {i < 2 && <i />}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) setStep(step + 1);
          else deploy();
        }}
      >
        <div className="builder-content">
          {step === 1 ? (
            <>
              <div className="section-label">
                <h2>What kind of business?</h2>
                <span>Choose the closest match for your work.</span>
              </div>
              <div className="sector-select-grid">
                {data.sectorPacks.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`sector-choice ${packId === p.id ? 'chosen' : ''}`}
                    onClick={() => choose(p)}
                  >
                    <span className="sector-illustration">
                      {p.id === 'food-vendor' ? <Utensils /> : <ShoppingBag />}
                    </span>
                    <h3>{businessTypeCopy[p.id].name}</h3>
                    <p>{businessTypeCopy[p.id].description}</p>
                    <Badge>{p.uses.length} services available</Badge>
                    {packId === p.id && (
                      <span className="choice-check">
                        <Check size={15} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="section-label">
                <h2>What would you like help with?</h2>
                <span>Switch on only what this business needs.</span>
              </div>
              <div className="component-toggle-grid">
                {pack.uses.map((id) => {
                  const c = data.components.find((c) => c.id === id)!;
                  const Icon = icons[id];
                  return (
                    <label
                      key={id}
                      className={`component-toggle ${selected.includes(id) ? 'enabled' : ''}`}
                    >
                      <Icon size={20} />
                      <span>
                        <strong>{serviceCopy[c.id].name}</strong>
                        <small>{serviceCopy[c.id].description}</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={selected.includes(id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? [...selected, id] : selected.filter((s) => s !== id),
                          )
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </>
          ) : step === 2 ? (
            <>
              <div className="section-label">
                <h2>Meet the business</h2>
                <span>A few details. A lot of possibilities.</span>
              </div>
              <Card className="builder-form form-stack">
                <div className="form-grid">
                  <label>
                    Business name
                    <input
                      placeholder="e.g. Corner Coffee"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Owner’s name
                    <input
                      placeholder="e.g. Alex Morgan"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Phone number
                    <input
                      placeholder="+1 202 555 0142"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={30}
                    />
                  </label>
                  <label>
                    Opening hours
                    <input
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      required
                      minLength={3}
                      maxLength={120}
                    />
                  </label>
                  <label>
                    Monthly staff cost ($)
                    <input
                      type="number"
                      value={staffCost}
                      onChange={(e) => setStaffCost(Number(e.target.value))}
                      min="0"
                      max="1000000"
                      required
                    />
                  </label>
                  <label>
                    Monthly staff hours
                    <input
                      type="number"
                      value={staffHours}
                      onChange={(e) => setStaffHours(Number(e.target.value))}
                      min="1"
                      max="20000"
                      required
                    />
                  </label>
                </div>
              </Card>
              <div className="section-label">
                <h2>{packId === 'food-vendor' ? 'The menu' : 'Products & services'}</h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCatalog([...catalog, { id: crypto.randomUUID(), name: '', price: 1 }])
                  }
                >
                  <Plus size={14} /> Add item
                </Button>
              </div>
              <Card className="editable-table">
                <div className="editable-table-head">
                  <span>Item name</span>
                  <span>Price ($)</span>
                  <span />
                </div>
                {catalog.map((item, i) => (
                  <div key={item.id} className="editable-table-row">
                    <input
                      aria-label={`Item ${i + 1} name`}
                      value={item.name}
                      placeholder="e.g. Classic burger"
                      onChange={(e) =>
                        setCatalog(
                          catalog.map((c, j) => (j === i ? { ...c, name: e.target.value } : c)),
                        )
                      }
                      required
                    />
                    <input
                      aria-label={`Item ${i + 1} price`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        setCatalog(
                          catalog.map((c, j) =>
                            j === i ? { ...c, price: Number(e.target.value) } : c,
                          ),
                        )
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove item ${i + 1}`}
                      disabled={catalog.length === 1}
                      onClick={() => setCatalog(catalog.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </Card>
              <div className="section-label">
                <h2>Stock & alert thresholds</h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setStock([
                      ...stock,
                      {
                        id: crypto.randomUUID(),
                        name: '',
                        quantity: 10,
                        threshold: 5,
                        unit: 'pieces',
                      },
                    ])
                  }
                >
                  <Plus size={14} /> Add stock item
                </Button>
              </div>
              <Card className="editable-table stock-table">
                <div className="editable-table-head">
                  <span>Stock name</span>
                  <span>Available</span>
                  <span>Alert below</span>
                  <span>Unit</span>
                  <span />
                </div>
                {stock.map((item, i) => (
                  <div key={item.id} className="editable-table-row">
                    <input
                      aria-label={`Stock ${i + 1} name`}
                      placeholder="e.g. Burger buns"
                      value={item.name}
                      onChange={(e) =>
                        setStock(
                          stock.map((s, j) => (j === i ? { ...s, name: e.target.value } : s)),
                        )
                      }
                    />
                    <input
                      aria-label={`Stock ${i + 1} quantity`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        setStock(
                          stock.map((s, j) =>
                            j === i ? { ...s, quantity: Number(e.target.value) } : s,
                          ),
                        )
                      }
                    />
                    <input
                      aria-label={`Stock ${i + 1} threshold`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.threshold}
                      onChange={(e) =>
                        setStock(
                          stock.map((s, j) =>
                            j === i ? { ...s, threshold: Number(e.target.value) } : s,
                          ),
                        )
                      }
                    />
                    <input
                      aria-label={`Stock ${i + 1} unit`}
                      value={item.unit}
                      onChange={(e) =>
                        setStock(
                          stock.map((s, j) => (j === i ? { ...s, unit: e.target.value } : s)),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove stock ${i + 1}`}
                      onClick={() => setStock(stock.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </Card>
              {stock.some((s) => s.name.trim()) && (
                <>
                  <div className="section-label">
                    <h2>Stock used per item</h2>
                    <span>Only approved live orders deduct this stock.</span>
                  </div>
                  <Card className="recipe-mapping">
                    {catalog
                      .filter((c) => c.name.trim())
                      .map((item) => (
                        <div key={item.id} className="recipe-item">
                          <h3>{item.name}</h3>
                          {stock
                            .filter((s) => s.name.trim())
                            .map((s) => (
                              <label key={s.id} className="recipe-row">
                                <span>
                                  {s.name}
                                  <small>{s.unit} per sale</small>
                                </span>
                                <input
                                  aria-label={`${item.name}: ${s.name} used per sale`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.ingredients?.[s.id] ?? 0}
                                  onChange={(e) =>
                                    setCatalog(
                                      catalog.map((c) => {
                                        if (c.id !== item.id) return c;
                                        const ingredients = { ...c.ingredients };
                                        const value = Number(e.target.value);
                                        if (value > 0) ingredients[s.id] = value;
                                        else delete ingredients[s.id];
                                        return { ...c, ingredients };
                                      }),
                                    )
                                  }
                                />
                              </label>
                            ))}
                        </div>
                      ))}
                  </Card>
                </>
              )}
            </>
          ) : (
            <Card className="deploy-review">
              <span className="deploy-symbol">
                <Workflow size={34} />
              </span>
              <Badge tone="green">Ready for your review</Badge>
              <h2>{name}</h2>
              <p>{businessTypeCopy[pack.id].name} · Trial setup</p>
              <div className="deploy-facts">
                <span>
                  Owner<strong>{owner}</strong>
                </span>
                <span>
                  Opening hours<strong>{hours}</strong>
                </span>
                <span>
                  Catalog<strong>{catalog.length} items</strong>
                </span>
                <span>
                  Baseline
                  <strong>
                    {money(staffCost)} / {staffHours} hours
                  </strong>
                </span>
              </div>
              <div className="review-components">
                {selected.map((id) => (
                  <span key={id}>
                    <Check size={14} />
                    {serviceCopy[id].name}
                  </span>
                ))}
              </div>
              <div className="callout">
                <ShieldCheck size={19} />
                <span>
                  Starts in trial mode. Every proposed action will wait for approval. Approved trial
                  actions are recorded without changing business operations.
                </span>
              </div>
            </Card>
          )}
        </div>
        <div className="builder-footer">
          <div>
            <strong>{selected.length}</strong> services selected{' '}
            <Badge tone="green">You approve every action</Badge>
          </div>
          <div className="button-row">
            {step > 1 && (
              <Button
                variant="outline"
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={busy}
              >
                <ArrowLeft size={15} /> Back
              </Button>
            )}
            <Button type="submit" disabled={selected.length === 0 || busy}>
              {busy ? 'Starting…' : step === 3 ? 'Start trial' : 'Continue'}
              {step === 3 ? <CheckCheck size={16} /> : <ArrowRight size={16} />}
            </Button>
          </div>
        </div>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
