import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

function AuctionListing() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    async function fetchAuctions() {
        try {
            const res = await API.get('/auctions/listing');
            setAuctions(res.data);
        } catch (err) {
            console.error('Failed to fetch auctions:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAuctions();
        // Auto refresh every 30 seconds
        const interval = setInterval(fetchAuctions, 30000);
        return () => clearInterval(interval);
    }, []);

    function getStatusStyle(status) {
        switch (status) {
            case 'active':
                return { backgroundColor: '#d4edda', color: '#155724' };
            case 'closed':
                return { backgroundColor: '#d6d8db', color: '#383d41' };
            case 'force_closed':
                return { backgroundColor: '#f8d7da', color: '#721c24' };
            case 'draft':
                return { backgroundColor: '#fff3cd', color: '#856404' };
            default:
                return {};
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString();
    }

    if (loading) return <div>Loading auctions...</div>;

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
               <h2 style={{
  display: "flex",
  alignItems: "center",
  gap: "8px"
}}>
  <img
    width="25"
    height="25"
    src="https://img.icons8.com/stickers/100/toggle-on.png"
    alt="Active"
  />
  <span>Active Auction</span>
</h2>
                <button
                    onClick={() => navigate('/create')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#e94560',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    + Create RFQ
                </button>
            </div>

            {auctions.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#888'
                }}>
                    No auctions found. Create your first RFQ!
                </div>
            ) : (
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                            <th style={thStyle}>Reference ID</th>
                            <th style={thStyle}>RFQ Name</th>
                            <th style={thStyle}>Lowest Bid (₹)</th>
                            <th style={thStyle}>Total Bids</th>
                            <th style={thStyle}>Bid Close Time</th>
                            <th style={thStyle}>Forced Close Time</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auctions.map((auction, index) => (
                            <tr
                                key={auction.id}
                                style={{
                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff'
                                }}
                            >
                                <td style={tdStyle}>{auction.reference_id}</td>
                                <td style={tdStyle}>{auction.name}</td>
                                <td style={tdStyle}>
                                    {auction.current_lowest_bid
                                        ? `₹${Number(auction.current_lowest_bid).toLocaleString()}`
                                        : '—'}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    {auction.total_bids}
                                </td>
                                <td style={tdStyle}>{formatDate(auction.bid_close_time)}</td>
                                <td style={tdStyle}>{formatDate(auction.forced_close_time)}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        ...getStatusStyle(auction.status)
                                    }}>
                                        {auction.status}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => navigate(`/auction/${auction.id}`)}
                                        style={{
                                            padding: '6px 14px',
                                            backgroundColor: '#1a1a2e',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            marginRight: '6px'
                                        }}
                                    >
                                        View
                                    </button>
                                    {auction.status === 'active' && (
                                        <button
                                            onClick={() => navigate(`/bid/${auction.id}`)}
                                            style={{
                                                padding: '6px 14px',
                                                backgroundColor: '#e94560',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Bid
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const thStyle = {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '13px'
};

const tdStyle = {
    padding: '12px 16px',
    fontSize: '14px',
    borderBottom: '1px solid #eee'
};

export default AuctionListing;