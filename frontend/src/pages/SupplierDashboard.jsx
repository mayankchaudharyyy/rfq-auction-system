import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock3, Radio, Search, Gavel, Calendar, Building, ShieldCheck, Eye, Layers } from 'lucide-react';
import API from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useSocket } from '../hooks/useSocket';

const money = (value) => value ? `₹${Number(value).toLocaleString('en-IN')}` : 'Awaiting initial quote';
const dateTime = (value) => value ? new Date(value).toLocaleString('en-IN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}) : '-';

export default function SupplierDashboard() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchRFQs = useCallback(async function fetchRFQs() {
    try {
      const res = await API.get('/rfqs/active');
      setRfqs(res.data);
    } catch {
      // Keep loading false on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRFQs(); }, [fetchRFQs]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => {
      setNotice('Carrier order board updated with live market movements.');
      fetchRFQs();
      setTimeout(() => setNotice(''), 5000);
    };
    socket.on('auction_list_updated', refresh);
    return () => socket.off('auction_list_updated', refresh);
  }, [socket, fetchRFQs]);

  const filteredRfqs = useMemo(() => {
    return rfqs.filter((rfq) => {
      const matchesSearch = 
        rfq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rfq.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rfq.buyer_company || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && rfq.status === 'active') ||
        (statusFilter === 'closed' && ['closed', 'force_closed'].includes(rfq.status));
        
      return matchesSearch && matchesStatus;
    });
  }, [rfqs, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: rfqs.length,
    active: rfqs.filter((r) => r.status === 'active').length,
    withLowestBid: rfqs.filter((r) => r.current_lowest_bid).length,
    acceptingBids: rfqs.filter((r) => r.status === 'active' && new Date(r.bid_close_time) > new Date()).length
  }), [rfqs]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="muted" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Radio size={32} style={{ animation: 'radar-pulse 1.5s infinite', color: 'var(--brand)' }} />
          <span>Connecting to carrier order book...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-info">
          <div className="eyebrow">
            <Radio size={14} /> Carrier Trading Terminal
          </div>
          <h1>Live Bidding Board</h1>
          <p>Analyze open shipping RFQs, place competitive quotes, and revise carrier rates in real time.</p>
        </div>
      </div>

      {notice && (
        <div className="alert info" style={{ marginBottom: '1.5rem' }}>
          <Radio size={16} /> 
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Open Opportunities</span>
            <span className="stat-value mono">{stats.total}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Layers size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Live Reverse Auctions</span>
            <span className="stat-value mono">{stats.active}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Radio size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Accepting Quotations</span>
            <span className="stat-value mono">{stats.acceptingBids}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Clock3 size={20} />
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon-inside" />
            <input 
              type="text" 
              placeholder="Search trade lane, reference ID, buyer company..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-tabs-wrapper">
            <button 
              className={`filter-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Trades ({rfqs.length})
            </button>
            <button 
              className={`filter-tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active Auctions ({stats.active})
            </button>
            <button 
              className={`filter-tab-btn ${statusFilter === 'closed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('closed')}
            >
              Concluded
            </button>
          </div>
        </div>
      </div>

      {/* Carrier Order Table */}
      {filteredRfqs.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>RFQ Description & Shipper</th>
                <th>Status</th>
                <th>Current L1 Rate</th>
                <th>Total Quotes</th>
                <th>Auction Window Closes</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRfqs.map((rfq) => {
                const isAccepting = rfq.status === 'active' && new Date(rfq.bid_close_time) > new Date();

                return (
                  <tr key={rfq.id}>
                    <td>
                      <span className="mono bold" style={{ color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                        {rfq.reference_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span className="bold" style={{ color: 'var(--text-main)' }}>{rfq.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="small muted">
                          <span>Shipper: {rfq.buyer_company || 'Verified Buyer'}</span>
                          <span>•</span>
                          <span>Pickup: {new Date(rfq.pickup_service_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={rfq.status} />
                    </td>
                    <td>
                      <span className="mono bold" style={{ color: rfq.current_lowest_bid ? 'var(--text-main)' : 'var(--text-faint)' }}>
                        {money(rfq.current_lowest_bid)}
                      </span>
                    </td>
                    <td>
                      <span className="mono bold" style={{ fontSize: '0.8125rem' }}>
                        {rfq.total_bids || 0}
                      </span>
                      <span className="small muted" style={{ marginLeft: '0.25rem' }}>quotes</span>
                    </td>
                    <td>
                      <span className="mono small muted">{dateTime(rfq.bid_close_time)}</span>
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        {isAccepting ? (
                          <button 
                            className="btn sm"
                            onClick={() => navigate(`/bid/${rfq.id}`)}
                          >
                            <Gavel size={13} /> Submit Quote
                          </button>
                        ) : null}

                        <button 
                          className="btn secondary sm"
                          onClick={() => navigate(`/auction/${rfq.id}`)}
                        >
                          <Eye size={13} /> View Terminal
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Radio size={24} />
          </div>
          <h3>No Open Freight RFQs</h3>
          <p>
            {searchTerm || statusFilter !== 'all' 
              ? 'No auctions match your search criteria.' 
              : 'There are currently no active auctions open for bidding.'}
          </p>
        </div>
      )}
    </>
  );
}
