'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CirclePlay,
  Layers3,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  Utensils,
  Zap,
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
      <nav className="landing-nav" aria-label="Website navigation">
        <Link href="/" aria-label="Gluons home">
          <Logo />
        </Link>
        <div className="landing-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#built-to-reuse">The building blocks</a>
          <a href="https://github.com/kowstav/gluons" target="_blank" rel="noreferrer">
            Open source <ArrowUpRight size={13} />
          </a>
        </div>
        <Link className="button button-outline" href="/dashboard">
          Open the demo <ArrowUpRight size={14} />
        </Link>
      </nav>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-spark">✳</span> A LITTLE AI. A LOT MORE TIME.
            </div>
            <h1>
              Big possibilities.
              <br />
              Less busywork<span>.</span>
            </h1>
            <p>
              Gluons gives small businesses reusable AI helpers that handle everyday work, keep
              costs low, and leave every decision with the owner.
            </p>
            <div className="hero-buttons">
              <Button
                onClick={() => {
                  setDone(false);
                  setBooking(true);
                }}
              >
                Book a free trial <ArrowRight size={17} />
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
            className="hero-art"
            aria-label="Reusable components and expert sector packs combine into your business integration"
          >
            <div className="hero-grid" />
            <span className="floating-label">
              <span className="status-dot" /> Your day, a little lighter.
            </span>
            <div className="hero-node node-phone">
              <Phone size={23} />
              <span>Phone agent</span>
              <BadgeCheck />
            </div>
            <div className="hero-node node-stock">
              <Layers3 size={23} />
              <span>Stock monitor</span>
              <BadgeCheck />
            </div>
            <div className="hero-node node-ledger">
              <Zap size={23} />
              <span>EfficientAI</span>
              <small>Right model. Smaller cost.</small>
            </div>
            <div className="hero-hub">
              <span className="hero-logo-symbol">✳</span>
              <strong>gluons.</strong>
            </div>
            <div className="hero-owner">
              <div className="owner-avatar">A</div>
              <div>
                <strong>The Morning Table</strong>
                <span>
                  <ShieldCheck size={12} /> Owner approved
                </span>
              </div>
              <Check size={19} />
            </div>
            <svg className="hero-connections" viewBox="0 0 550 500" fill="none" aria-hidden="true">
              <path
                d="M110 120C110 210 275 130 275 250M430 120C430 210 275 130 275 250M130 320C180 320 200 250 275 250M275 250V410"
                stroke="#d9cbb6"
                strokeWidth="2"
                strokeDasharray="5 6"
              />
            </svg>
            <span className="hero-star star-one">✴</span>
            <span className="hero-star star-two">✳</span>
            <span className="hero-star star-three">✦</span>
          </div>
        </section>
        <section id="how-it-works" className="landing-section">
          <div className="landing-section-heading">
            <div className="eyebrow">A SMALL CHANGE TO YOUR EVERYDAY</div>
            <h2>
              You run the business.
              <br />
              Let the little things connect.
            </h2>
            <p>
              A customer calls. Stock gets low. A receipt comes in.
              <br />
              Gluons brings the next step to you, ready for a decision.
            </p>
          </div>
          <div className="landing-feature-grid">
            <div>
              <span className="feature-number">01 / REUSE</span>
              <Layers3 size={30} />
              <h3>Good tools, shared.</h3>
              <p>
                Phone agents, order takers, stock monitors and more. Built as reusable blocks, so
                each business starts ahead.
              </p>
            </div>
            <div>
              <span className="feature-number">02 / SPECIALIZE</span>
              <Utensils size={30} />
              <h3>Expert once. Easy after.</h3>
              <p>
                AI engineers and sector experts build the foundation. Setting up the next shop is
                just filling in its details.
              </p>
            </div>
            <div>
              <span className="feature-number">03 / APPROVE</span>
              <ShieldCheck size={30} />
              <h3>Your business. Your call.</h3>
              <p>
                Every proposed action waits for you. Approve, edit or reject from your phone, with a
                clear record of the decision.
              </p>
            </div>
          </div>
        </section>
        <section id="built-to-reuse" className="landing-demo-section">
          <div>
            <div className="eyebrow">MEET YOUR NEW BREATHING ROOM</div>
            <h2>
              A clear view of
              <br />
              what’s working.
            </h2>
            <p>
              See estimated hours returned, review pending actions, and follow every task’s model
              and cost. Try it with a sample food business, then build your own integration.
            </p>
            <Link href="/dashboard" className="button button-primary">
              Explore the working prototype <ArrowRight size={16} />
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
            <p>The Morning Table · Estimated sample savings</p>
            <div className="mini-metrics">
              <div>
                <small>Time given back</small>
                <strong>
                  49.3 <span>hrs</span>
                </strong>
              </div>
              <div>
                <small>You’re in control</small>
                <strong>
                  100<span>%</span>
                </strong>
              </div>
              <div>
                <small>Built to reuse</small>
                <strong>
                  6 <span>blocks</span>
                </strong>
              </div>
            </div>
            <div className="mini-chart">
              <svg viewBox="0 0 500 130" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="miniFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#e77d51" stopOpacity=".35" />
                    <stop offset="100%" stopColor="#e77d51" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 112C30 106 32 80 60 89S98 120 125 80S165 70 200 62S245 95 280 55S330 60 360 35S400 50 425 25S475 34 500 5V130H0Z"
                  fill="url(#miniFill)"
                />
                <path
                  d="M0 112C30 106 32 80 60 89S98 120 125 80S165 70 200 62S245 95 280 55S330 60 360 35S400 50 425 25S475 34 500 5"
                  stroke="#dd784e"
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
          <span className="cta-spark">✳</span>
          <div className="eyebrow">SMALL TASKS. MORE POSSIBILITIES.</div>
          <h2>
            Make a little room
            <br />
            for what’s next.
          </h2>
          <p>
            Try Gluons alongside your business.
            <br />
            See the difference before changing a thing.
          </p>
          <Button
            onClick={() => {
              setDone(false);
              setBooking(true);
            }}
          >
            Book a free trial <ArrowRight size={17} />
          </Button>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>Built for the people who make business happen.</span>
        <div>
          <a href="https://github.com/kowstav/gluons" target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={13} />
          </a>
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
            <p>
              Your free trial request is saved. The Gluons team can use your details to follow up.
            </p>
            <small>
              This prototype records requests. It does not send a confirmation email or reserve a
              calendar appointment.
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
              <input name="email" type="email" required maxLength={180} autoComplete="email" />
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
              A walkthrough of the working prototype using synthetic demo data.
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
function BadgeCheck() {
  return (
    <span className="node-check">
      <Check size={12} />
    </span>
  );
}
