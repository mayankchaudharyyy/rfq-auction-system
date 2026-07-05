import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, CheckCircle2, Clock3, Gavel, Plus, Search, ArrowUpRight, Radio, Eye, Lock } from 'lucide-react';
import API from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useSocket } from '../hooks/useSocket';

const money = (value) => value ? `₹${Number(value).toLocaleString('en-IN')}` : 'No bids';
const dateTime = (value) => value ? new Date(value).toLocaleString('en-IN', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}) : '-';

export default function BuyerDashboard() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchRFQs = useCallback(async function fetchRFQs() {
    try {
      const res = await API.get('/rfqs/my');
      setRfqs(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load RFQs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRFQs(); }, [fetchRFQs]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => fetchRFQs();
    socket.on('auction_list_updated', refresh);
    return () => socket.off('auction_list_updated', refresh);
  }, [socket, fetchRFQs]);

  const stats = useMemo(() => ({
    total: rfqs.length,
    active: rfqs.filter((r) => r.status === 'active').length,
    draft: rfqs.filter((r) => r.status === 'draft').length,
    closed: rfqs.filter((r) => ['closed', 'force_closed'].includes(r.status)).length,
    bids: rfqs.reduce((sum, r) => sum + (r.total_bids || 0), 0)
  }), [rfqs]);

  const filteredRfqs = useMemo(() => {
    return rfqs.filter((rfq) => {
      const matchesSearch = 
        rfq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rfq.reference_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'closed' 
          ? ['closed', 'force_closed'].includes(rfq.status) 
          : rfq.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [rfqs, searchTerm, statusFilter]);

  async function activate(id) {
    try {
      await API.post(`/auctions/activate/${id}`);
      fetchRFQs();
    } catch (err) {
      setError(err.response?.data?.error || 'Activation failed.');
    }
  }

  async function close(id) {
    try {
      await API.post(`/auctions/close/${id}`);
      fetchRFQs();
    } catch (err) {
      setError(err.response?.data?.error || 'Closing failed.');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="muted" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Activity size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--brand)' }} />
          <span>Synchronizing procurement workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-info">
          <div className="eyebrow">
            <Radio size={14} /> Buyer Command Center
          </div>
          <h1>RFQ Control Room</h1>
          <p>Monitor reverse auction liquidity, review live carrier proposals, and execute contract awards.</p>
        </div>
        <div className="row-actions">
          <Link className="btn" to="/create">
            <Plus size={16} /> Deploy New RFQ
          </Link>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* KPI Metric Cards */}
      <section className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Portfolios</span>
            <span className="stat-value mono">{stats.total}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Gavel size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Active Auctions</span>
            <span className="stat-value mono">{stats.active}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Activity size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Draft Specs</span>
            <span className="stat-value mono">{stats.draft}</span>
          </div>
          <div className="stat-icon-wrapper">
            <Clock3 size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Settled / Closed</span>
            <span className="stat-value mono">{stats.closed}</span>
          </div>
          <div className="stat-icon-wrapper">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon-inside" />
            <input 
              type="text" 
              placeholder="Search by reference ID, port origin, cargo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-tabs-wrapper">
            <button 
              className={`filter-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({rfqs.length})
            </button>
            <button 
              className={`filter-tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active ({stats.active})
            </button>
            <button 
              className={`filter-tab-btn ${statusFilter === 'draft' ? 'active' : ''}`}
              onClick={() => setStatusFilter('draft')}
            >
              Drafts ({stats.draft})
            </button>
            <button 
              className={`filter-tab-btn ${statusFilter === 'closed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('closed')}
            >
              Closed ({stats.closed})
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {filteredRfqs.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>RFQ Description / Trade Lane</th>
                <th>Status</th>
                <th>Current L1 Rate</th>
                <th>Carrier Bids</th>
                <th>Bid Close Window</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRfqs.map((rfq) => (
                <tr key={rfq.id}>
                  <td>
                    <span className="mono bold" style={{ color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                      {rfq.reference_id}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span className="bold" style={{ color: 'var(--text-main)' }}>{rfq.name}</span>
                      <span className="small muted">
                        Pickup Date: {new Date(rfq.pickup_service_date).toLocaleDateString()}
                      </span>
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
                      {rfq.status === 'draft' && (
                        <button 
                          className="btn sm" 
                          onClick={() => activate(rfq.id)}
                        >
                          <Radio size={13} /> Launch
                        </button>
                      )}
                      
                      {rfq.status === 'active' && (
                        <button 
                          className="btn danger sm" 
                          onClick={() => close(rfq.id)}
                        >
                          Force Close
                        </button>
                      )}

                      <button 
                        className="btn secondary sm" 
                        onClick={() => navigate(`/auction/${rfq.id}`)}
                      >
                        <Eye size={13} /> Live Board
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Gavel size={24} />
          </div>
          <h3>No Procurement RFQs Found</h3>
          <p>
            {searchTerm || statusFilter !== 'all' 
              ? 'No RFQs match your current search or status filter criteria.' 
              : 'You have not deployed any reverse auctions yet. Create your first freight RFQ to invite carriers.'}
          </p>
          <Link className="btn" to="/create">
            <Plus size={16} /> Create First RFQ
          </Link>
        </div>
      )}
    </>
  );
}
