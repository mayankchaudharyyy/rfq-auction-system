import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, Gavel, Radio, Trophy, Calendar, Compass, ShieldAlert, Award, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import API from '../api/axios';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

const money = (value) => value ? `₹${Number(value).toLocaleString('en-IN')}` : 'No quotes';
const dateTime = (value) => value ? new Date(value).toLocaleString('en-IN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}) : '-';

export default function AuctionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [winnerBid, setWinnerBid] = useState(null);
  const [notice, setNotice] = useState('');

  // States for timer and highlights
  const [countdownText, setCountdownText] = useState('Ended');
  const [timerAlertClass, setTimerAlertClass] = useState('');
  const [highlightedBidId, setHighlightedBidId] = useState(null);
  
  const prevBidsRef = useRef([]);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await API.get(`/rfqs/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load auction details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  // Socket triggers
  useEffect(() => {
    if (!socket) return undefined;
    socket.emit('join_rfq_room', id);
    
    const refresh = (eventData) => {
      setNotice(eventData?.message || 'Live auction board updated with incoming carrier bid.');
      fetchDetails();
      setTimeout(() => setNotice(''), 4000);
    };

    socket.on('bid_rankings_updated', refresh);
    socket.on('auction_status_changed', refresh);
    socket.on('winner_selected', refresh);
    
    return () => {
      socket.off('bid_rankings_updated', refresh);
      socket.off('auction_status_changed', refresh);
      socket.off('winner_selected', refresh);
      socket.emit('leave_rfq_room', id);
    };
  }, [socket, id, fetchDetails]);

  // Fallback status checks
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await API.post(`/auctions/check-status/${id}`);
        fetchDetails();
      } catch {
        clearInterval(interval);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [id, fetchDetails]);

  // Real-time Countdown effect
  useEffect(() => {
    if (!data?.rfq) return;
    
    const { status, bid_close_time } = data.rfq;
    
    if (status !== 'active') {
      setCountdownText(status === 'draft' ? 'Draft Specification' : 'Auction Concluded');
      setTimerAlertClass('');
      return;
    }

    const tick = () => {
      const diff = new Date(bid_close_time) - new Date();
      if (diff <= 0) {
        setCountdownText('Clearing Market...');
        setTimerAlertClass('');
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      
      setCountdownText(`${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);

      // Color triggers
      if (totalSeconds < 120) {
        setTimerAlertClass('timer-pulse-red');
      } else if (totalSeconds < 300) {
        setTimerAlertClass('timer-pulse-orange');
      } else {
        setTimerAlertClass('');
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data]);

  // Bid update flash highlights
  useEffect(() => {
    if (!data?.bids) return;

    const prevBids = prevBidsRef.current;
    
    const changed = data.bids.find((bid) => {
      const match = prevBids.find((p) => p.id === bid.id);
      if (!match) return true;
      return match.total_amount !== bid.total_amount;
    });

    if (changed) {
      setHighlightedBidId(changed.id);
      const clear = setTimeout(() => setHighlightedBidId(null), 2000);
      return () => clearTimeout(clear);
    }

    prevBidsRef.current = data.bids;
  }, [data?.bids]);

  async function activateAuction() {
    await API.post(`/auctions/activate/${id}`);
    fetchDetails();
  }

  async function closeAuction() {
    await API.post(`/auctions/close/${id}`);
    fetchDetails();
  }

  async function selectWinner() {
    await API.post(`/auctions/select-winner/${id}/${winnerBid.id}`);
    setWinnerBid(null);
    fetchDetails();
  }

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div className="muted" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Radio size={32} style={{ animation: 'radar-pulse 1.5s infinite', color: 'var(--brand)' }} />
        <span>Retrieving live auction order book...</span>
      </div>
    </div>
  );
  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="alert error">Auction details not found.</div>;

  const { rfq, bids, activity_log } = data;
  const isBuyer = user.role === 'buyer';

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn ghost sm" onClick={() => navigate(`/${user.role}`)}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span className="mono bold" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {rfq.reference_id}
            </span>
            <StatusBadge status={rfq.status} />
          </div>
          <h1>{rfq.name}</h1>
          <p>
            Shipper: <strong>{rfq.buyer_name}</strong> ({rfq.buyer_company || 'Enterprise'}) • 
            Target Pickup: {new Date(rfq.pickup_service_date).toLocaleDateString()}
          </p>
        </div>
        <div className="row-actions">
          {isBuyer && rfq.status === 'draft' && (
            <button className="btn" onClick={activateAuction}>
              <Radio size={16} /> Launch Live Auction
            </button>
          )}
          {isBuyer && rfq.status === 'active' && (
            <button className="btn danger" onClick={closeAuction}>
              Force Close
            </button>
          )}
          {!isBuyer && rfq.status === 'active' && (
            <button className="btn" onClick={() => navigate(`/bid/${id}`)}>
              <Gavel size={16} /> Submit / Revise Quote
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="alert info" style={{ marginBottom: '1.5rem' }}>
          <Radio size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Terminal Grid */}
      <div className="auction-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Key Metrics */}
          <section className="grid grid-3">
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Remaining Time</span>
                <span className={`stat-value mono timer-display ${timerAlertClass}`}>
                  {countdownText}
                </span>
              </div>
              <div className="stat-icon-wrapper">
                <Clock3 size={20} />
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Lowest Market Rate</span>
                <span className="stat-value mono">
                  {rfq.current_lowest_bid ? money(rfq.current_lowest_bid) : 'Awaiting Bids'}
                </span>
              </div>
              <div className="stat-icon-wrapper">
                <Trophy size={20} />
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Quotes Received</span>
                <span className="stat-value mono">{bids.length}</span>
              </div>
              <div className="stat-icon-wrapper">
                <Gavel size={20} />
              </div>
            </div>
          </section>

          {/* Bidding Leaderboard */}
          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Carrier Bidding Board & Ranking</h3>
                <p className="small muted">Ranked in real time by Total Landed Cost (Lowest first)</p>
              </div>
              <div className="system-status-pill" style={{ margin: 0 }}>
                <span className="status-dot-pulse" />
                <span>Socket Connected</span>
              </div>
            </div>
            
            <div className="table-wrap" style={{ margin: 0, border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Supplier / Carrier</th>
                    <th>Freight (Base)</th>
                    <th>Origin THC</th>
                    <th>Dest. THC</th>
                    <th>Total Landed</th>
                    <th>Transit</th>
                    <th>Status</th>
                    {isBuyer && ['closed', 'force_closed'].includes(rfq.status) && (
                      <th style={{ textAlign: 'right' }}>Award</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bids.length > 0 ? (
                    bids.map((bid, index) => {
                      const isL1 = index === 0;
                      const isL2 = index === 1;
                      const isL3 = index === 2;
                      const isHighlight = highlightedBidId === bid.id;
                      const isWinningBid = bid.is_winner;

                      return (
                        <tr 
                          key={bid.id}
                          className={`${isHighlight ? 'bid-row-new' : ''} ${bid.supplier_id === user.id ? 'own-bid-row' : ''}`}
                        >
                          <td>
                            {isL1 ? (
                              <span className="rank l1">L1</span>
                            ) : isL2 ? (
                              <span className="rank l2">L2</span>
                            ) : isL3 ? (
                              <span className="rank l3">L3</span>
                            ) : (
                              <span className="rank">L{index + 1}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                              <span className="bold" style={{ color: 'var(--text-main)' }}>
                                {bid.supplier_name || 'Carrier Forwarder'}
                              </span>
                              <span className="small muted">
                                Vessel Line: <strong>{bid.carrier_name}</strong>
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="mono bold">{money(bid.freight_charges)}</span>
                          </td>
                          <td>
                            <span className="mono small muted">{money(bid.origin_charges)}</span>
                          </td>
                          <td>
                            <span className="mono small muted">{money(bid.destination_charges)}</span>
                          </td>
                          <td>
                            <span className="mono bold" style={{ color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                              {money(bid.total_amount)}
                            </span>
                          </td>
                          <td>
                            <span className="mono small muted">{bid.transit_time}</span>
                          </td>
                          <td>
                            {isWinningBid ? (
                              <StatusBadge status="closed" winner={true} />
                            ) : isL1 && rfq.status === 'active' ? (
                              <span className="badge active" style={{ fontSize: '0.625rem' }}>
                                <span className="badge-dot" /> Current Best
                              </span>
                            ) : (
                              <span className="small muted">Submitted</span>
                            )}
                          </td>
                          {isBuyer && ['closed', 'force_closed'].includes(rfq.status) && (
                            <td style={{ textAlign: 'right' }}>
                              {!rfq.winning_bid_id && (
                                <button 
                                  className="btn sm" 
                                  onClick={() => setWinnerBid(bid)}
                                >
                                  <Award size={13} /> Select Winner
                                </button>
                              )}
                              {rfq.winning_bid_id === bid.id && (
                                <span className="bold" style={{ color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                                  ✓ Contract Awarded
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No carrier rate quotations have been placed on this auction yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Rail: Anti-Snipe Info & Live Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Anti-Sniping Parameter Spec */}
          <div className="card">
            <div className="card-header">
              <h3>Auction Extension Rules</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Trigger Window</span>
                <span className="mono bold">{rfq.trigger_window_minutes || 10} minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Extension Duration</span>
                <span className="mono bold">+{rfq.extension_duration_minutes || 5} minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Hard Stop Ceiling</span>
                <span className="mono small">{dateTime(rfq.forced_close_time)}</span>
              </div>
              <div style={{ padding: '0.625rem 0.75rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-xs)', marginTop: '0.25rem', border: '1px solid var(--surface-border)' }}>
                <span className="small muted" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <ShieldCheck size={14} color="var(--text-muted)" /> 
                  Dynamic sniper protection prevents last-minute quote manipulation.
                </span>
              </div>
            </div>
          </div>

          {/* Audit Event Feed */}
          <div className="card">
            <div className="card-header">
              <h3>Live Activity Audit</h3>
              <span className="mono small muted">{activity_log?.length || 0} events</span>
            </div>
            
            <div className="activity-feed">
              {activity_log && activity_log.length > 0 ? (
                activity_log.map((item, i) => {
                  const isBid = item.event_type?.includes('bid');
                  return (
                    <div 
                      key={i} 
                      className={`activity-item ${isBid ? 'bid-event' : 'system-event'}`}
                    >
                      <div className="activity-item-info">
                        <span className="bold" style={{ color: 'var(--text-main)' }}>{item.message}</span>
                        <span className="activity-item-time">{dateTime(item.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  No logged activity events yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Confirmation Modal */}
      {winnerBid && (
        <Modal 
          title="Confirm Contract Award" 
          onClose={() => setWinnerBid(null)}
          actions={
            <>
              <button className="btn secondary" onClick={() => setWinnerBid(null)}>
                Cancel
              </button>
              <button className="btn" onClick={selectWinner}>
                <Award size={15} /> Confirm Award Selection
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p>
              You are about to award this freight contract to <strong>{winnerBid.supplier_name || 'Selected Carrier'}</strong> with carrier line <strong>{winnerBid.carrier_name}</strong>.
            </p>
            <div style={{ padding: '1rem', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="muted">Total Landed Amount:</span>
                <span className="mono bold" style={{ color: 'var(--text-main)', fontSize: '1.125rem' }}>
                  {money(winnerBid.total_amount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Quoted Transit Time:</span>
                <span className="mono bold">{winnerBid.transit_time}</span>
              </div>
            </div>
            <p className="small muted">
              Once awarded, this decision is logged in the regulatory compliance audit trail and notifications are broadcast to all participants.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
