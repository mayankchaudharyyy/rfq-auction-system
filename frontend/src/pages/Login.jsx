import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Anchor, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login credentials invalid.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-mark"><Anchor size={20} /></span>
        </div>
        <div className="auth-header">
          <h2>Enterprise Sign In</h2>
          <p>Access your BidFlow reverse auction workspace</p>
        </div>
        
        {error && <div className="alert error">{error}</div>}
        
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Work Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              <input 
                type="email" 
                required 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                placeholder="name@company.com"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          
          <div className="field">
            <label>Security Password</label>
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
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem' }}>
          <span className="muted">Need an enterprise account? </span>
          <Link to="/signup" style={{ color: 'var(--text-main)', fontWeight: 600 }}>
            Register workspace
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-faint)', fontSize: '0.75rem' }}>
          <ShieldCheck size={14} color="var(--text-muted)" />
          <span>256-Bit Encrypted Procurement Portal</span>
        </div>
      </div>
    </div>
  );
}
