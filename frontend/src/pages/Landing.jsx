import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Clock3, LockKeyhole, Anchor, ShieldCheck, Zap, Radio, Search, TrendingDown, Layers, FileText } from 'lucide-react';

export default function Landing() {
  const [routeQuery, setRouteQuery] = useState('');
  const navigate = useNavigate();

  function handleStart(e) {
    e.preventDefault();
    navigate('/signup');
  }

  return (
    <div className="landing">
      {/* Navigation matching reference */}
      <header className="landing-nav">
        <div className="brand">
          <span className="brand-mark"><Anchor size={16} /></span>
          <span className="brand-title">BidFlow</span>
        </div>

        <nav className="nav-center-links">
          <a href="#overview">Overview</a>
          <a href="#terminal">Platform</a>
          <a href="#solutions">Solutions</a>
          <a href="#features">Engine Specs</a>
        </nav>

        <div className="row-actions">
          <Link className="btn ghost sm" to="/login">Login</Link>
          <Link className="btn sm pill" to="/signup">
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Hero Section matching Techflow X layout */}
      <section className="landing-hero" id="overview">
        <div className="landing-content">
          <h1>
            Gain control<br />
            with freight<br />
            reverse auctions
          </h1>
          <p className="hero-copy">
            Automate multi-carrier bidding rounds, eliminate rate inflation with dynamic auto-extension rules, and secure transparent market-clearing freight rates.
          </p>
          <div className="hero-actions">
            <Link className="btn pill" to="/signup">
              Get started <ArrowRight size={14} />
            </Link>
            <Link className="btn secondary pill" to="/login">
              Access workspace
            </Link>
          </div>
        </div>

        {/* Floating macOS App Window Mockup */}
        <div className="saas-window-mockup" id="terminal">
          <div className="window-titlebar">
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <div className="window-url-bar">
              app.bidflow.io/auctions/live-analytics
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="status-dot-pulse" />
              <span className="mono" style={{ fontSize: '0.625rem', color: '#16a34a', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          <div className="window-body">
            {/* Window Left Mini-Sidebar */}
            <div className="window-sidebar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 0.25rem' }}>
                <span className="brand-mark" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '3px' }}>
                  <Anchor size={10} />
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>BidFlow X</span>
              </div>

              <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                <Search size={10} style={{ position: 'absolute', left: '0.375rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  readOnly 
                  placeholder="Search lane..." 
                  style={{ width: '100%', fontSize: '0.625rem', padding: '0.25rem 0.25rem 0.25rem 1.125rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
                />
              </div>

              <div className="window-sidebar-nav">
                <div className="window-sidebar-link active">
                  <BarChart3 size={11} />
                  <span>Auctions</span>
                </div>
                <div className="window-sidebar-link">
                  <Layers size={11} />
                  <span>RFQs</span>
                </div>
                <div className="window-sidebar-link">
                  <FileText size={11} />
                  <span>Audit Log</span>
                </div>
              </div>
            </div>

            {/* Window Main Content Area */}
            <div className="window-main-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="mono" style={{ fontSize: '0.5625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    OVERVIEW // FREIGHT ANALYTICS
                  </div>
                  <h4 style={{ fontSize: '0.875rem', marginTop: '0.125rem', fontWeight: 700 }}>
                    Freight & Auction Analytics
                  </h4>
                </div>
                <span className="badge active" style={{ fontSize: '0.5625rem', padding: '0.125rem 0.375rem' }}>
                  <span className="badge-dot" /> Live Room
                </span>
              </div>

              {/* 3 Metric Chips */}
              <div className="window-stat-grid">
                <div className="window-stat-chip">
                  <span className="window-stat-label">Total Quotes</span>
                  <span className="window-stat-val">182</span>
                  <span className="window-stat-sub">↑ 12.4% vs benchmark</span>
                </div>
                <div className="window-stat-chip">
                  <span className="window-stat-label">Market Best L1</span>
                  <span className="window-stat-val">₹82,400</span>
                  <span className="window-stat-sub" style={{ color: '#0f172a' }}>6 Days Transit</span>
                </div>
                <div className="window-stat-chip">
                  <span className="window-stat-label">Bid Velocity</span>
                  <span className="window-stat-val">4.8/m</span>
                  <span className="window-stat-sub">Dynamic Anti-Snipe</span>
                </div>
              </div>

              {/* Visual Rate Clearance Chart */}
              <div className="window-chart-card">
                <div className="window-chart-header">
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#334155' }}>
                    Competitive Rate Trajectory (Reverse Clearing Curve)
                  </span>
                  <span className="mono" style={{ fontSize: '0.625rem', color: '#16a34a', fontWeight: 600 }}>
                    -14.8% Margin Saved
                  </span>
                </div>

                {/* SVG Area Chart */}
                <div style={{ width: '100%', height: '85px', position: 'relative' }}>
                  <svg viewBox="0 0 400 85" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f172a" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="400" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="400" y2="80" stroke="#f1f5f9" />
                    {/* Area Fill */}
                    <path
                      d="M 0,18 C 60,25 120,40 180,48 C 240,56 300,68 400,72 L 400,85 L 0,85 Z"
                      fill="url(#chartGradient)"
                    />
                    {/* Curve Line */}
                    <path
                      d="M 0,18 C 60,25 120,40 180,48 C 240,56 300,68 400,72"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    {/* Nodes */}
                    <circle cx="0" cy="18" r="3" fill="#0f172a" />
                    <circle cx="180" cy="48" r="3" fill="#0f172a" />
                    <circle cx="400" cy="72" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: '#94a3b8', marginTop: '0.25rem' }} className="mono">
                  <span>Start (₹98,000)</span>
                  <span>5m</span>
                  <span>10m</span>
                  <span>15m</span>
                  <span>L1 Cleared (₹82,400)</span>
                </div>
              </div>

              {/* Carrier Board Mini Table */}
              <div style={{ border: '1px solid #f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ fontSize: '0.6875rem' }}>
                  <thead>
                    <tr style={{ background: '#fafbfc' }}>
                      <th style={{ padding: '0.3125rem 0.5rem', fontSize: '0.5625rem' }}>Rank</th>
                      <th style={{ padding: '0.3125rem 0.5rem', fontSize: '0.5625rem' }}>Carrier Line</th>
                      <th style={{ padding: '0.3125rem 0.5rem', fontSize: '0.5625rem' }}>Landed Quote</th>
                      <th style={{ padding: '0.3125rem 0.5rem', fontSize: '0.5625rem' }}>Transit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.03)' }}>
                      <td style={{ padding: '0.3125rem 0.5rem' }}><span className="rank l1" style={{ fontSize: '0.5625rem', padding: '0.125rem 0.3125rem' }}>L1</span></td>
                      <td style={{ padding: '0.3125rem 0.5rem', fontWeight: 600 }}>Maersk Line A/S</td>
                      <td style={{ padding: '0.3125rem 0.5rem', fontWeight: 700 }} className="mono">₹82,400</td>
                      <td style={{ padding: '0.3125rem 0.5rem', color: '#64748b' }}>6 Days</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.3125rem 0.5rem' }}><span className="rank l2" style={{ fontSize: '0.5625rem', padding: '0.125rem 0.3125rem' }}>L2</span></td>
                      <td style={{ padding: '0.3125rem 0.5rem' }}>CMA CGM Group</td>
                      <td style={{ padding: '0.3125rem 0.5rem' }} className="mono">₹84,100</td>
                      <td style={{ padding: '0.3125rem 0.5rem', color: '#64748b' }}>5 Days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent SaaS Box Container (Replaces Fake Metrics Strip) */}
      <section className="saas-cta-section" id="solutions">
        <div className="saas-cta-box">
          <div className="saas-cta-badge">
            <Zap size={12} /> Autonomous Freight Procurement
          </div>
          
          <h2 className="saas-cta-title">
            Get freight quotes at true market clearing rates
          </h2>

          <p className="saas-cta-desc">
            Deploy your first reverse auction in under 2 minutes. Connect with verified ocean and air carriers to drive down shipping costs through live, anti-snipe protected bidding rounds.
          </p>

          <form className="saas-cta-input-row" onSubmit={handleStart}>
            <input 
              type="text" 
              className="saas-cta-input" 
              placeholder="Enter trade lane (e.g., Nhava Sheva to Jebel Ali)..." 
              value={routeQuery}
              onChange={(e) => setRouteQuery(e.target.value)}
            />
            <button type="submit" className="saas-cta-btn">
              Get Started Free <ArrowRight size={14} />
            </button>
          </form>

          <div className="saas-cta-checklist">
            <span>✓ Zero commitment setup</span>
            <span>✓ Automated anti-sniping extensions</span>
            <span>✓ Anonymized L1 rank privacy</span>
            <span>✓ Immutable SOX-ready audit ledger</span>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="landing-band" id="features">
        <div className="feature-card">
          <div className="feature-icon">
            <Clock3 size={18} />
          </div>
          <h3>Dynamic Anti-Snipe Engine</h3>
          <p>
            Eliminate predatory last-second bid sniping. Our real-time auction engine automatically extends closing windows whenever competitive bids arrive in final minutes.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <BarChart3 size={18} />
          </div>
          <h3>Anonymous L1 Rank Discovery</h3>
          <p>
            Carriers view live rank indicators (L1, L2, L3) and competitive spread metrics without exposing proprietary freight rates or carrier brand identities.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <LockKeyhole size={18} />
          </div>
          <h3>Immutable Audit Trail</h3>
          <p>
            Meet stringent enterprise and SOX compliance standards. Every rate proposal, time extension, and buyer contract award is logged immutably.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 BidFlow Logistics Technologies Inc. Enterprise SaaS RFQ Auction System. All rights reserved.</p>
      </footer>
    </div>
  );
}
