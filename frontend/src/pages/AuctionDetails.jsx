import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

function AuctionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(null);

    const fetchDetails = useCallback(async () => {
        try {
            const res = await API.get(`/rfqs/${id}`);
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch auction details:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Check and update auction status
    const checkStatus = useCallback(async () => {
        try {
            await API.post(`/auctions/check-status/${id}`);
            fetchDetails();
        } catch (err) {
            console.error('Failed to check status:', err);
        }
    }, [id, fetchDetails]);

    useEffect(() => {
        fetchDetails();
        const refreshInterval = setInterval(() => {
            checkStatus();
        }, 15000);
        return () => clearInterval(refreshInterval);
    }, [fetchDetails, checkStatus]);

    // Countdown timer
    useEffect(() => {
        if (!data) return;
        const timer = setInterval(() => {
            const now = new Date();
            const closeTime = new Date(data.rfq.bid_close_time);
            const diff = closeTime - now;
            if (diff <= 0) {
                setTimeRemaining('Closed');
                checkStatus();
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeRemaining(`${mins}m ${secs}s`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [data, checkStatus]);

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString();
    }

    function getStatusStyle(status) {
        switch (status) {
            case 'active': return { backgroundColor: '#d4edda', color: '#155724' };
            case 'closed': return { backgroundColor: '#d6d8db', color: '#383d41' };
            case 'force_closed': return { backgroundColor: '#f8d7da', color: '#721c24' };
            case 'draft': return { backgroundColor: '#fff3cd', color: '#856404' };
            default: return {};
        }
    }

    function getRankLabel(rank) {
        if (rank === 1) return { label: 'L1', color: '#28a745' };
        if (rank === 2) return { label: 'L2', color: '#fd7e14' };
        if (rank === 3) return { label: 'L3', color: '#dc3545' };
        return { label: `L${rank}`, color: '#6c757d' };
    }

    function getEventIcon(eventType) {
        switch (eventType) {
            case 'bid_submitted': return '';
            case 'time_extended': return '';
            case 'auction_closed': return '';
            case 'force_closed': return '';
            default: return '';
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!data) return <div style={{ padding: '40px' }}>Auction not found.</div>;

    const { rfq, auction_config, bids, activity_log } = data;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                style={{
                    marginBottom: '16px',
                    padding: '8px 16px',
                    backgroundColor: '#1a1a2e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                }}
            >
                ← Back
            </button>

            {/* Header */}
            <div style={{
                backgroundColor: '#1a1a2e',
                color: '#fff',
                padding: '20px 24px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>{rfq.name}</h2>
                    <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '14px' }}>
                        {rfq.reference_id} • Buyer: {rfq.buyer_name}
                    </p>
                </div>
                <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    ...getStatusStyle(rfq.status)
                }}>
                    {rfq.status}
                </span>
            </div>

            {/* Info Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <InfoCard
                    title="⏳ Time Remaining"
                    value={rfq.status === 'active' ? timeRemaining || '...' : 'Ended'}
                    highlight={rfq.status === 'active'}
                />
                <InfoCard
                    title="🕐 Bid Close Time"
                    value={formatDate(rfq.bid_close_time)}
                />
                <InfoCard
                    title="🚫 Forced Close"
                    value={formatDate(rfq.forced_close_time)}
                />
                <InfoCard
                    title="📦 Pickup Date"
                    value={new Date(rfq.pickup_service_date).toLocaleDateString()}
                />
            </div>

            {/* Auction Config */}
            {auction_config && (
                <div style={{
                    backgroundColor: '#f0f4ff',
                    border: '1px solid #c0d0ff',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    marginBottom: '24px'
                }}>
                    <h3 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
  <img
    width="27"
    height="27"
    src="https://img.icons8.com/ios/50/automatic.png"
    alt="automatic"
  />
  Auction Configuration
</h3>
                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', fontSize: '14px' }}>
                        <span>
                            <strong>Trigger Window:</strong> {auction_config.trigger_window_minutes} mins
                        </span>
                        <span>
                            <strong>Extension Duration:</strong> {auction_config.extension_duration_minutes} mins
                        </span>
                        <span>
                            <strong>Extension Trigger:</strong> {auction_config.extension_trigger.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
            )}

            {/* Bids Table */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <h3 style={{
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}>
                        <img
                            src="https://img.icons8.com/doodle/48/analytics.png"
                            width="28"
                            height="28"
                            alt="analytics"
                        />
                        Supplier Bids
                    </h3>
                    {rfq.status === 'active' && (
                        <button
                            onClick={() => navigate(`/bid/${rfq.id}`)}
                            style={{
                                padding: '8px 18px',
                                backgroundColor: '#e94560',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            + Submit Bid
                        </button>
                    )}
                </div>

                {bids.length === 0 ? (
                    <div style={{
                        padding: '30px',
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        color: '#888'
                    }}>
                        No bids submitted yet.
                    </div>
                ) : (
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                                <th style={thStyle}>Rank</th>
                                <th style={thStyle}>Supplier</th>
                                <th style={thStyle}>Carrier</th>
                                <th style={thStyle}>Freight (₹)</th>
                                <th style={thStyle}>Origin (₹)</th>
                                <th style={thStyle}>Destination (₹)</th>
                                <th style={thStyle}>Total (₹)</th>
                                <th style={thStyle}>Transit</th>
                                <th style={thStyle}>Valid Until</th>
                                <th style={thStyle}>Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bids.map((bid, index) => {
                                const rank = getRankLabel(bid.ranking);
                                return (
                                    <tr
                                        key={bid.id}
                                        style={{
                                            backgroundColor: bid.ranking === 1 ? '#f0fff4' : index % 2 === 0 ? '#f9f9f9' : '#fff'
                                        }}
                                    >
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <span style={{
                                                padding: '3px 10px',
                                                borderRadius: '12px',
                                                backgroundColor: rank.color,
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                fontSize: '12px'
                                            }}>
                                                {rank.label}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{bid.supplier_name}</td>
                                        <td style={tdStyle}>{bid.carrier_name}</td>
                                        <td style={tdStyle}>₹{Number(bid.freight_charges).toLocaleString()}</td>
                                        <td style={tdStyle}>₹{Number(bid.origin_charges).toLocaleString()}</td>
                                        <td style={tdStyle}>₹{Number(bid.destination_charges).toLocaleString()}</td>
                                        <td style={{
                                            ...tdStyle,
                                            fontWeight: bid.ranking === 1 ? 'bold' : 'normal',
                                            color: bid.ranking === 1 ? '#28a745' : '#000'
                                        }}>
                                            ₹{Number(bid.total_amount).toLocaleString()}
                                        </td>
                                        <td style={tdStyle}>{bid.transit_time} days</td>
                                        <td style={tdStyle}>{new Date(bid.quote_validity).toLocaleDateString()}</td>
                                        <td style={tdStyle}>{formatDate(bid.submitted_at)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Activity Log */}
            <div>
                <h3 style={{
  marginBottom: '12px',
  display: "flex",
  alignItems: "center",
  gap: "3px"
}}>
  <img
    src="https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-logs-mobile-app-development-flaticons-lineal-color-flat-icons-2.png"
    width="30"
    height="30"
    alt="logs"
  />
  Activity Log
</h3>
                {activity_log.length === 0 ? (
                    <div style={{ color: '#888' }}>No activity yet.</div>
                ) : (
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        overflow: 'hidden'
                    }}>
                        {activity_log.map((log, index) => (
                            <div
                                key={log.id}
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: index < activity_log.length - 1 ? '1px solid #eee' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                    backgroundColor: log.event_type === 'time_extended' ? '#fffbe6' : '#fff'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '20px' }}>
                                        {getEventIcon(log.event_type)}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                            {log.description}
                                        </div>
                                        {log.event_type === 'time_extended' && (
                                            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                                {formatDate(log.old_close_time)} → {formatDate(log.new_close_time)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#888',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {formatDate(log.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoCard({ title, value, highlight }) {
    return (
        <div style={{
            backgroundColor: highlight ? '#1a1a2e' : '#f9f9f9',
            color: highlight ? '#fff' : '#333',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
        }}>
            <div style={{ fontSize: '12px', marginBottom: '6px', opacity: 0.7 }}>{title}</div>
            <div style={{
                fontSize: highlight ? '22px' : '15px',
                fontWeight: 'bold'
            }}>
                {value}
            </div>
        </div>
    );
}

const thStyle = {
    padding: '12px 14px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '13px'
};

const tdStyle = {
    padding: '11px 14px',
    fontSize: '13px',
    borderBottom: '1px solid #eee'
};

export default AuctionDetails;