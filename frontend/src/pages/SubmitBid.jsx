import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, ShieldCheck, Landmark, Compass, Info, CheckCircle2 } from 'lucide-react';
import API from '../api/axios';
import Modal from '../components/Modal';

export default function SubmitBid() {
  const { rfq_id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [form, setForm] = useState({ 
    carrier_name: '', 
    freight_charges: '', 
    origin_charges: '', 
    destination_charges: '', 
    transit_time: '', 
    quote_validity: '' 
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  
  const total = useMemo(() => {
    return (Number(form.freight_charges) || 0) + (Number(form.origin_charges) || 0) + (Number(form.destination_charges) || 0);
  }, [form]);

  useEffect(() => {
    async function fetchRFQ() {
      try {
        const res = await API.get(`/rfqs/${rfq_id}`);
        setRfq(res.data.rfq);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load RFQ details.');
      } finally {
        setLoading(false);
      }
    }
    fetchRFQ();
  }, [rfq_id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submitBid() {
    setSubmitting(true);
    setError('');
    try {
      await API.post('/bids/submit', {
        rfq_id,
        ...form,
        freight_charges: Number(form.freight_charges),
        origin_charges: Number(form.origin_charges) || 0,
        destination_charges: Number(form.destination_charges) || 0,
        transit_time: String(form.transit_time)
      });
      navigate(`/auction/${rfq_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to submit bid.');
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div className="muted">Loading carrier quote sheet...</div>
    </div>
  );

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn ghost sm" onClick={() => navigate(`/auction/${rfq_id}`)}>
          <ArrowLeft size={16} /> Back to Live Auction
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div className="page-header-info">
          <div className="eyebrow">
            <Landmark size={13} /> Rate Proposal Console
          </div>
          <h1>Submit Bidding Quote</h1>
          <p>Provide ocean freight rates, origin/destination terminal handling charges, and transit commitments.</p>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '1.75rem', alignItems: 'start' }}>
        <form className="form" onSubmit={(e) => { e.preventDefault(); setConfirming(true); }}>
          
          {/* Card 1: Carrier & Vessel Info */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={16} color="var(--text-main)" />
                <span>Operating Vessel Line & Equipment</span>
              </h3>
            </div>
            
            <div className="grid grid-2">
              <div className="field">
                <label>Carrier / Vessel Line Name</label>
                <input 
                  name="carrier_name" 
                  value={form.carrier_name} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., Maersk Line, MSC, CMA CGM" 
                />
              </div>

              <div className="field">
                <label>Estimated Transit Time</label>
                <input 
                  name="transit_time" 
                  value={form.transit_time} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., 6 Days (Port to Port)" 
                />
              </div>

              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Quote Validity Period</label>
                <input 
                  type="date" 
                  name="quote_validity" 
                  value={form.quote_validity} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Card 2: Cost Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Landmark size={16} color="var(--text-main)" />
                <span>Itemized Commercial Freight Fees</span>
              </h3>
            </div>
            
            <div className="grid grid-3">
              <div className="field">
                <label>Base Ocean Freight (₹)</label>
                <input 
                  type="number" 
                  name="freight_charges" 
                  value={form.freight_charges} 
                  onChange={handleChange} 
                  required 
                  min="1" 
                  placeholder="0.00" 
                />
              </div>

              <div className="field">
                <label>Origin THC (₹)</label>
                <input 
                  type="number" 
                  name="origin_charges" 
                  value={form.origin_charges} 
                  onChange={handleChange} 
                  min="0" 
                  placeholder="0.00" 
                />
              </div>

              <div className="field">
                <label>Destination THC (₹)</label>
                <input 
                  type="number" 
                  name="destination_charges" 
                  value={form.destination_charges} 
                  onChange={handleChange} 
                  min="0" 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn" type="submit" style={{ minWidth: '160px' }}>
              <Send size={14} /> Review & Submit Quote
            </button>
            <button className="btn secondary" type="button" onClick={() => navigate(`/auction/${rfq_id}`)}>
              Cancel
            </button>
          </div>
        </form>

        {/* Right Rail: Real-time Landed Cost Sheet */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Landed Quote Breakdown</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4375rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="muted">Base Ocean Freight:</span>
                <span className="mono bold">₹{Number(form.freight_charges || 0).toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4375rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="muted">Origin Handling (THC):</span>
                <span className="mono bold">₹{Number(form.origin_charges || 0).toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4375rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="muted">Destination Handling (THC):</span>
                <span className="mono bold">₹{Number(form.destination_charges || 0).toLocaleString('en-IN')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                <span className="bold">Total Landed Rate:</span>
                <span className="mono bold" style={{ color: 'var(--text-main)', fontSize: '1.25rem' }}>
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              {rfq?.current_lowest_bid && (
                <div style={{ 
                  padding: '0.6875rem 0.75rem', 
                  borderRadius: 'var(--radius-xs)', 
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  marginTop: '0.25rem',
                  fontSize: '0.75rem'
                }}>
                  {total === 0 ? (
                    <span>Current market best rate is <strong>₹{Number(rfq.current_lowest_bid).toLocaleString('en-IN')}</strong></span>
                  ) : total < rfq.current_lowest_bid ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Your quote beats current L1 by ₹{(rfq.current_lowest_bid - total).toLocaleString('en-IN')}!
                    </span>
                  ) : (
                    <span>Current L1 is ₹{Number(rfq.current_lowest_bid).toLocaleString('en-IN')}. Submit a lower quote to take rank #1.</span>
                  )}
                </div>
              )}

              <div style={{ padding: '0.625rem 0.75rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <ShieldCheck size={14} color="var(--text-muted)" />
                  Quotes are sealed and ranked anonymously on the live board.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirming && (
        <Modal 
          title="Confirm Rate Quotation" 
          onClose={() => setConfirming(false)}
          actions={
            <>
              <button className="btn secondary" onClick={() => setConfirming(false)}>
                Edit Rates
              </button>
              <button className="btn" disabled={submitting} onClick={submitBid}>
                {submitting ? 'Transmitting...' : 'Confirm & Transmit Quote'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <p>
              Please verify your commercial freight quotation before sending to the live auction room:
            </p>
            <div style={{ padding: '0.875rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span className="muted">Carrier Line:</span>
                <span className="bold">{form.carrier_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span className="muted">Transit Time:</span>
                <span className="mono bold">{form.transit_time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4375rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span className="bold">Total Landed Amount:</span>
                <span className="mono bold" style={{ color: 'var(--text-main)', fontSize: '1.0625rem' }}>
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <p className="small muted">
              Submitting within the active trigger window will automatically extend the auction clock according to the buyer's anti-sniping rules.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
