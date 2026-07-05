import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Anchor, User, Mail, Lock, Briefcase, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', company_name: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await signup(form);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <span className="brand-mark"><Anchor size={20} /></span>
        </div>
        <div className="auth-header">
          <h2>Create Workspace Account</h2>
          <p>Deploy freight RFQs or bid competitively as a carrier line</p>
        </div>

        {error && <div className="alert error">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Select Workspace Role</label>
            <div className="role-tabs">
              <button 
                type="button" 
                className={form.role === 'buyer' ? 'active' : ''} 
                onClick={() => setForm({ ...form, role: 'buyer' })}
              >
                Buyer (Shipper / Cargo Owner)
              </button>
              <button 
                type="button" 
                className={form.role === 'supplier' ? 'active' : ''} 
                onClick={() => setForm({ ...form, role: 'supplier' })}
              >
                Supplier (Carrier / Line)
              </button>
            </div>
          </div>

          <div className="field">
            <label>Contact Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              <input 
                required 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g. Sarah Jenkins"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="field">
            <label>Organization / Company Name</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              <input 
                required 
                value={form.company_name} 
                onChange={(e) => setForm({ ...form, company_name: e.target.value })} 
                placeholder="e.g. Pacific Logistics Corp"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="field">
            <label>Corporate Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              <input 
                type="email" 
                required 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                placeholder="s.jenkins@pacificlogistics.com"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="field">
            <label>Create Secure Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              <input 
                type="password" 
                required 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                placeholder="••••••••••••"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button className="btn full" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Setting up workspace...' : 'Complete Enterprise Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem' }}>
          <span className="muted">Already registered? </span>
          <Link to="/login" style={{ color: 'var(--text-main)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-faint)', fontSize: '0.75rem' }}>
          <ShieldCheck size={14} color="var(--text-muted)" />
          <span>SOC2 Type II Certified Cloud Infrastructure</span>
        </div>
      </div>
    </div>
  );
}
