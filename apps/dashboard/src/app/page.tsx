'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CirclePlay,
  ClipboardList,
  Clock3,
  Layers3,
  Phone,
  MessageSquare,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { Button, Dialog, Logo } from '@/components/ui';
import { api } from '@/lib/client';
export default function Landing() {
  const [booking, setBooking] = useState(false),
    [video, setVideo] = useState(false),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState('');
  async function book(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api('/api/bookings', 'POST', Object.fromEntries(form));
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="landing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="landing-nav" aria-label="Website navigation">
        <Link href="/" aria-label="Gluons home">
          <Logo />
        </Link>
        <div className="landing-nav-links">
          <a href="#what-we-help-with">What we help with</a>
          <a href="#how-it-works">How it works</a>
          <a href="#your-trial">Your trial</a>
        </div>
        <Link className="button button-outline" href="/dashboard">
          Open the demo <ArrowUpRight size={14} />
        </Link>
      </nav>
      <main id="main">
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> A little AI. A lot more time.
            </div>
            <h1>
              Less routine work.
              <br />
              More time for you.
            </h1>
            <p>
              AI help for customer calls, orders, stock and everyday records. We help you get set up
              around your business, and you review each action before it happens.
            </p>
            <div className="hero-buttons">
              <Button
                onClick={() => {
                  setDone(false);
                  setBooking(true);
                }}
              >
                Request a free trial <ArrowRight size={17} />
              </Button>
              <button className="watch-demo" onClick={() => setVideo(true)}>
                <CirclePlay size={24} /> See it in action <span>· 30 sec</span>
              </button>
            </div>
            <div className="hero-assurances">
              <span>
                <Check size={14} /> Your approval, always
              </span>
              <span>
                <Check size={14} /> Trial it alongside your business
              </span>
            </div>
          </div>
          <div
            className="workday-preview"
            role="img"
            aria-label="Illustrative approval workflow: a customer asks for two burgers, Gluons prepares the order, and the owner reviews it before anything happens."
          >
            <div className="workday-top">
              <div>
                <span className="preview-business-icon">M</span>
                <span>
                  The Morning Table<small>Your workday, in one place</small>
                </span>
              </div>
              <span className="preview-live">
                <span className="status-dot" /> Trial
              </span>
            </div>
            <div className="workday-body">
              <div className="workday-heading">
                <h2>Ready when you are.</h2>
                <span>2 to review</span>
              </div>
              <div className="request-bubble">
                <span className="request-icon">
                  <Phone size={18} aria-hidden="true" />
                </span>
                <div>
                  <small>Customer call</small>
                  <p>“Two classic burgers for pickup, please.”</p>
                </div>
              </div>
              <div className="preview-connector">
                <span />
                Order prepared for your review
              </div>
              <div className="order-preview">
                <div className="order-preview-top">
                  <span>
                    <ClipboardList size={18} aria-hidden="true" /> New pickup order
                  </span>
                  <span className="preview-pending">Needs approval</span>
                </div>
                <div className="order-preview-item">
                  <span>
                    2 × Classic burger<small>Pickup · Today, 12:30 pm</small>
                  </span>
                  <strong>$19.00</strong>
                </div>
                <div className="preview-review">
                  <span>
                    <ShieldCheck size={17} aria-hidden="true" /> Your approval comes first
                  </span>
                  <span className="preview-review-button">
                    Review order <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </div>
              <div className="stock-preview">
                <span className="stock-preview-icon">
                  <Layers3 size={19} aria-hidden="true" />
                </span>
                <div>
                  <strong>Burger buns are running low</strong>
                  <small>Stock alert ready for your review</small>
                </div>
                <ArrowUpRight size={17} aria-hidden="true" />
              </div>
            </div>
            <div className="workday-foot">
              <ShieldCheck size={15} aria-hidden="true" /> Nothing happens without your say.
              <span>Sample workspace</span>
            </div>
          </div>
        </section>
        <section id="what-we-help-with" className="landing-section">
          <div className="landing-section-heading">
            <div className="eyebrow">Built around your day</div>
            <h2>
              More time with customers.
              <br />
              Less time on the little things.
            </h2>
            <p>
              A customer calls. Stock gets low. A receipt comes in.
              <br />
              See what needs attention and review the next step in one place.
            </p>
          </div>
          <div className="landing-feature-grid">
            <div>
              <span className="feature-number">Calls, orders & replies</span>
              <Phone size={30} />
              <h3>Be there for your customers.</h3>
              <p>
                Capture what callers need, prepare orders from your menu or catalog, and review
                answers to common customer questions.
              </p>
            </div>
            <div>
              <span className="feature-number">Stock, expenses & updates</span>
              <ClipboardList size={30} />
              <h3>Keep the everyday work in view.</h3>
              <p>
                Check low-stock alerts, review prepared expense entries, and get a daily summary of
                what needs your attention.
              </p>
            </div>
            <div>
              <span className="feature-number">You stay in control</span>
              <ShieldCheck size={30} />
              <h3>Your business. Your call.</h3>
              <p>
                Every proposed action waits for you. Approve, edit or reject from your phone, with a
                clear record of the decision.
              </p>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="landing-section customer-start">
          <div className="landing-section-heading">
            <div className="eyebrow">From your first task onward</div>
            <h2>
              Tell us what takes your time.
              <br />
              We’ll help with the setup.
            </h2>
            <p>You don’t need to choose AI tools or connect everything yourself.</p>
          </div>
          <div className="landing-feature-grid">
            <div>
              <span className="feature-number">01 / Your business</span>
              <MessageSquare size={30} />
              <h3>Start with your day.</h3>
              <p>
                Tell us which calls, orders or admin jobs take the most time. Choose the work you
                want help with first.
              </p>
            </div>
            <div>
              <span className="feature-number">02 / Setup support</span>
              <Settings2 size={30} />
              <h3>Make it fit your work.</h3>
              <p>
                We help set up your business details, opening hours, menu or catalog, and stock
                alerts. You review how it will work.
              </p>
            </div>
            <div>
              <span className="feature-number">03 / Try & compare</span>
              <Clock3 size={30} />
              <h3>Decide using your own numbers.</h3>
              <p>
                Try Gluons alongside your current process. Compare completed tasks, estimated time
                returned and usage costs before deciding what comes next.
              </p>
            </div>
          </div>
        </section>
        <section id="your-trial" className="landing-demo-section">
          <div>
            <div className="eyebrow">A trial you can measure</div>
            <h2>
              A clear view of
              <br />
              what’s working.
            </h2>
            <p>
              Keep your current way of working during the trial. Review proposed actions and compare
              the work completed, your review time and estimated savings. Explore the sample
              dashboard to see what you’ll be able to check.
            </p>
            <Link href="/dashboard" className="button button-primary">
              Explore the sample dashboard <ArrowRight size={16} />
            </Link>
            <button className="text-link" onClick={() => setVideo(true)}>
              <CirclePlay size={16} /> Watch the demo walkthrough
            </button>
          </div>
          <Link
            href="/dashboard"
            className="landing-dashboard-preview"
            aria-label="Open the Gluons demo dashboard"
          >
            <div className="mini-top">
              <Logo />
              <span>
                <span className="status-dot" /> Trial workspace
              </span>
            </div>
            <div className="mini-heading">
              More time for what matters<span>.</span>
            </div>
            <p>Illustrative dashboard · Sample data, not a savings promise</p>
            <div className="mini-metrics">
              <div>
                <small>Time given back</small>
                <strong>
                  49.3 <span>hrs</span>
                </strong>
              </div>
              <div>
                <small>Ready for review</small>
                <strong>
                  5 <span>tasks</span>
                </strong>
              </div>
              <div>
                <small>Approval required</small>
                <strong>Always</strong>
              </div>
            </div>
            <div className="mini-chart">
              <svg viewBox="0 0 500 130" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="miniFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2855d9" stopOpacity=".2" />
                    <stop offset="100%" stopColor="#2855d9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 112C30 106 32 80 60 89S98 120 125 80S165 70 200 62S245 95 280 55S330 60 360 35S400 50 425 25S475 34 500 5V130H0Z"
                  fill="url(#miniFill)"
                />
                <path
                  d="M0 112C30 106 32 80 60 89S98 120 125 80S165 70 200 62S245 95 280 55S330 60 360 35S400 50 425 25S475 34 500 5"
                  stroke="#2855d9"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
            </div>
            <div className="mini-approval">
              <ShieldCheck size={20} />
              <span>
                2 × Classic burger · $19.00<small>Waiting for your approval</small>
              </span>
              <span className="mini-approve">
                Review <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        </section>
        <section className="landing-cta">
          <div className="eyebrow">Small tasks. More possibilities.</div>
          <h2>
            Make a little room
            <br />
            for what’s next.
          </h2>
          <p>
            Try Gluons alongside your business.
            <br />
            See what it could give back to your day.
          </p>
          <Button
            onClick={() => {
              setDone(false);
              setBooking(true);
            }}
          >
            Request a free trial <ArrowRight size={17} />
          </Button>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>Built for the people who make business happen.</span>
        <div>
          <a href="#how-it-works">How it works</a>
          <Link href="/dashboard">Open demo</Link>
        </div>
      </footer>
      <Dialog
        open={booking}
        onClose={() => setBooking(false)}
        title={done ? 'A little more possibility, on the way.' : 'Let’s make room in your day.'}
      >
        {done ? (
          <div className="booking-success">
            <ShieldCheck size={38} />
            <p>Your free trial request is saved, along with your contact details for follow-up.</p>
            <small>
              No appointment has been booked. This demo does not send a confirmation email.
            </small>
            <Button onClick={() => setBooking(false)}>Done</Button>
          </div>
        ) : (
          <form onSubmit={book} className="form-stack">
            <p className="muted">Tell us a little about your business to request a free trial.</p>
            <label>
              Your name
              <input name="name" required minLength={2} maxLength={100} autoComplete="name" />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                required
                maxLength={180}
                autoComplete="email"
                spellCheck={false}
              />
            </label>
            <label>
              Business name
              <input
                name="business"
                required
                minLength={2}
                maxLength={120}
                autoComplete="organization"
              />
            </label>
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="honeypot"
              aria-hidden="true"
            />
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving your request…' : 'Request a free trial'}
              <ArrowRight size={16} />
            </Button>
          </form>
        )}
      </Dialog>
      <Dialog
        open={video}
        onClose={() => setVideo(false)}
        title="A little AI. A lot more time."
        wide
      >
        {video && (
          <>
            <video
              className="demo-video"
              controls
              autoPlay
              playsInline
              src="/demo.webm"
              poster="/demo-poster.png"
            >
              <track kind="captions" src="/demo.vtt" srcLang="en" label="English" default />
            </video>
            <p className="muted">
              A sample business walkthrough. The figures are illustrative, not promised results.
            </p>
            <Link href="/dashboard" className="button button-primary">
              Try it yourself <ArrowRight size={16} />
            </Link>
          </>
        )}
      </Dialog>
    </div>
  );
}
