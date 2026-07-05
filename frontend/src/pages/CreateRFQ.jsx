import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Settings2, ShieldCheck, Compass, Anchor, Info } from 'lucide-react';
import API from '../api/axios';

export default function CreateRFQ() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    pickup_service_date: '',
    bid_start_time: '',
    bid_close_time: '',
    forced_close_time: '',
    trigger_window_minutes: 10,
    extension_duration_minutes: 5,
    extension_trigger: 'bid_received'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Date validations
    if (new Date(form.bid_close_time) <= new Date(form.bid_start_time)) {
      setError('Bidding closing time must be chronologically after start time.');
      return;
    }
    if (new Date(form.forced_close_time) <= new Date(form.bid_close_time)) {
      setError('Hard ceiling (forced close) time must be after normal closing time.');
      return;
    }

    setLoading(true);
    try {
      await API.post('/rfqs/create', form);
      navigate('/buyer');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create RFQ.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn ghost sm" onClick={() => navigate('/buyer')}>
          <ArrowLeft size={16} /> Back to Command Center
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div className="page-header-info">
          <div className="eyebrow">
            <Anchor size={13} /> New Procurement RFQ
          </div>
          <h1>Deploy Freight Auction</h1>
          <p>Configure trade lane timelines, carrier bidding rules, and automated anti-sniping extension parameters.</p>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '1.75rem', alignItems: 'start' }}>
        <form className="form" onSubmit={handleSubmit}>
          
          {/* Card 1: Shipment & Route */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={16} color="var(--text-main)" /> 
                <span>Trade Lane & Service Parameters</span>
              </h3>
            </div>
            
            <div className="grid grid-2">
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Trade Lane / RFQ Title</label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., Nhava Sheva (INNSA) to Hamburg (DEHAM) - 40ft FCL High Cube" 
                />
                <span className="field-hint">Specify origin, destination port, and container equipment type.</span>
              </div>
              
              <div className="field">
                <label>Target Pickup / Service Date</label>
                <input 
                  type="date" 
                  name="pickup_service_date" 
                  value={form.pickup_service_date} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Card 2: Bidding Window Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarClock size={16} color="var(--text-main)" /> 
                <span>Auction Window & Schedule</span>
              </h3>
            </div>
            
            <div className="grid grid-2">
              <div className="field">
                <label>Bidding Start Time</label>
                <input 
                  type="datetime-local" 
                  name="bid_start_time" 
                  value={form.bid_start_time} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="field">
                <label>Scheduled Close Time</label>
                <input 
                  type="datetime-local" 
                  name="bid_close_time" 
                  value={form.bid_close_time} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Hard Stop Forced Close Ceiling</label>
                <input 
                  type="datetime-local" 
                  name="forced_close_time" 
                  value={form.forced_close_time} 
                  onChange={handleChange} 
                  required 
                />
                <span className="field-hint">Absolute deadline beyond which dynamic extensions cannot expand.</span>
              </div>
            </div>
          </div>

          {/* Card 3: Anti-Sniping Rules */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings2 size={16} color="var(--text-main)" /> 
                <span>Dynamic Anti-Sniping Engine</span>
              </h3>
            </div>
            
            <div className="grid grid-2">
              <div className="field">
                <label>Trigger Window (Minutes)</label>
                <input 
                  type="number" 
                  name="trigger_window_minutes" 
                  value={form.trigger_window_minutes} 
                  onChange={handleChange} 
                  required 
                  min="1" 
                  max="60" 
                />
                <span className="field-hint">Minutes before close to monitor for late bids.</span>
              </div>

              <div className="field">
                <label>Extension Length (Minutes)</label>
                <input 
                  type="number" 
                  name="extension_duration_minutes" 
                  value={form.extension_duration_minutes} 
                  onChange={handleChange} 
                  required 
                  min="1" 
                  max="60" 
                />
                <span className="field-hint">Time added when a sniper bid is detected.</span>
              </div>

              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Extension Condition</label>
                <select 
                  name="extension_trigger" 
                  value={form.extension_trigger} 
                  onChange={handleChange}
                >
                  <option value="bid_received">Any Valid Bid Received in Trigger Window</option>
                  <option value="new_lowest_bid">Only When a New L1 (Lowest) Bid is Set</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn" type="submit" disabled={loading} style={{ minWidth: '160px' }}>
              {loading ? 'Deploying Auction...' : 'Deploy Freight Auction'}
            </button>
            <button className="btn secondary" type="button" onClick={() => navigate('/buyer')}>
              Cancel
            </button>
          </div>
        </form>

        {/* Right Rail: Auction Execution Summary Preview */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="card" style={{ background: 'var(--surface)' }}>
            <div className="card-header">
              <h3>Auction Lifecycle Preview</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                <div className="stat-icon-wrapper" style={{ width: '2rem', height: '2rem', flexShrink: 0 }}>
                  <ShieldCheck size={14} color="var(--text-main)" />
                </div>
                <div>
                  <span className="bold" style={{ color: 'var(--text-main)', display: 'block' }}>
                    Competitive Liquidity Protection
                  </span>
                  <span className="muted">
                    If any quote is received within the final <strong>{form.trigger_window_minutes || 10} minutes</strong>, the clock automatically adds <strong>+{form.extension_duration_minutes || 5} minutes</strong>.
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.875rem' }}>
                <div className="stat-label" style={{ marginBottom: '0.5rem' }}>Summary Specs</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Route Description:</span>
                    <span className="bold" style={{ maxWidth: '170px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.name || 'Untitled Route'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Target Pickup:</span>
                    <span className="mono bold">{form.pickup_service_date || 'Not set'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Auction Mode:</span>
                    <span className="badge active" style={{ fontSize: '0.625rem' }}>Timed Reverse</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.625rem 0.75rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Info size={14} color="var(--text-muted)" />
                  Carriers will receive instant push updates over WebSocket upon auction launch.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
