import { useState } from 'react';
import { Activity, ArrowRight, Eye, EyeOff, GitFork, ShieldCheck, Zap } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { setCredentials } from '../store.js';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      dispatch(setCredentials(data)); navigate('/');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to connect. Check the API and try again.'); }
    finally { setBusy(false); }
  };
  return <div className="auth-page">
    <section className="auth-visual"><div className="auth-brand"><div className="brand-mark"><Activity size={19} /></div><strong>impact<span>.ops</span></strong></div>
      <div className="auth-visual-content"><div className="live-tag"><span /> LIVE SYSTEM INTELLIGENCE</div><h1>See the whole<br /><span>blast radius.</span></h1><p>Map your service ecosystem, understand cascading risk, and make confident decisions before incidents happen.</p>
        <div className="auth-feature"><span><GitFork size={17} /></span><div><b>Connected system graph</b><small>Understand every critical relationship</small></div><span className="feature-check">✓</span></div>
        <div className="auth-feature"><span><Zap size={17} /></span><div><b>Instant impact simulation</b><small>Predict downstream failure paths</small></div><span className="feature-check">✓</span></div>
        <div className="auth-feature"><span><ShieldCheck size={17} /></span><div><b>Enterprise-ready security</b><small>Role-based, auditable, secure by design</small></div><span className="feature-check">✓</span></div>
      </div><div className="auth-visual-foot"><div className="avatar-stack"><i>A</i><i>J</i><i>M</i><i>+</i></div><span>Trusted by teams keeping<br />mission-critical systems running.</span></div>
      <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
    </section>
    <section className="auth-form-side"><div className="auth-form-wrap"><div className="auth-mobile-brand"><div className="brand-mark"><Activity size={19} /></div><strong>impact<span>.ops</span></strong></div>
      <div className="form-kicker">WELCOME TO IMPACT.OPS</div><h2>{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</h2><p className="auth-subtitle">Get a clear view of your system's health and dependencies.</p>
      <form onSubmit={submit}>{mode === 'register' && <label className="form-label">Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Morgan" /></label>}
        <label className="form-label">Work email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></label>
        <label className="form-label">Password<span className="password-field"><input required type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /><button type="button" className="password-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        {error && <div className="form-error">{error}</div>}<button className="primary-btn auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={17} /></button>
      </form><div className="auth-switch">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></div>
      <div className="auth-secure"><ShieldCheck size={14} /> Protected by enterprise-grade encryption</div>
    </div><div className="auth-legal">© 2025 Impact Operations <span>·</span> Privacy <span>·</span> Terms</div></section>
  </div>;
}
