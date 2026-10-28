'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { browserSupabase } from '@/lib/client';
import { Button, Card, Logo } from '@/components/ui';
export default function Login() {
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const client = browserSupabase();
    if (!client) {
      window.location.href = '/dashboard';
      return;
    }
    setBusy(true);
    setMessage('');
    const result = signup
      ? await client.auth.signUp({ email, password })
      : await client.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (result.data.session) window.location.href = '/dashboard';
    else setMessage('Check your email to confirm your account, then sign in.');
    setBusy(false);
  }
  return (
    <main className="login-page">
      <Link href="/">
        <Logo />
      </Link>
      <Card className="login-card">
        <span className="orange-icon">
          <ShieldCheck size={25} />
        </span>
        <h1>{signup ? 'A good place to begin.' : 'Welcome back.'}</h1>
        <p className="muted">
          {signup ? 'Create your owner workspace.' : 'Sign in to your Gluons workspace.'}
        </p>
        <form onSubmit={submit} className="form-stack">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signup ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
          </label>
          {message && (
            <p className="callout" role="status">
              {message}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? 'One moment…' : signup ? 'Create workspace' : 'Sign in'}
            <ArrowRight size={15} />
          </Button>
        </form>
        <button className="text-link" onClick={() => setSignup(!signup)}>
          {signup ? 'Already have an account? Sign in' : 'New to Gluons? Create an account'}
        </button>
        <Link href="/dashboard" className="text-link">
          Open local demo <ArrowRight size={14} />
        </Link>
      </Card>
    </main>
  );
}
