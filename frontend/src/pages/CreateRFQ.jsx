import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

function CreateRFQ() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        buyer_id: 1,
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
        setLoading(true);
        try {
            const res = await API.post('/rfqs/create', form);
            // Auto activate the RFQ
            await API.post(`/auctions/activate/${res.data.rfq_id}`);
            alert(`RFQ Created! Reference: ${res.data.reference_id}`);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = {
        width: '100%',
        padding: '10px',
        marginTop: '5px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '15px',
        fontWeight: '500'
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Create New RFQ</h2>

            {error && (
                <div style={{
                    backgroundColor: '#ffe0e0',
                    color: '#cc0000',
                    padding: '10px',
                    borderRadius: '6px',
                    marginBottom: '15px'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <label style={labelStyle}>
                    RFQ Name
                    <input
                        style={inputStyle}
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Mumbai to Delhi Freight"
                    />
                </label>

                <label style={labelStyle}>
                    Pickup / Service Date
                    <input
                        style={inputStyle}
                        type="date"
                        name="pickup_service_date"
                        value={form.pickup_service_date}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label style={labelStyle}>
                    Bid Start Time
                    <input
                        style={inputStyle}
                        type="datetime-local"
                        name="bid_start_time"
                        value={form.bid_start_time}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label style={labelStyle}>
                    Bid Close Time
                    <input
                        style={inputStyle}
                        type="datetime-local"
                        name="bid_close_time"
                        value={form.bid_close_time}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label style={labelStyle}>
                    Forced Close Time
                    <input
                        style={inputStyle}
                        type="datetime-local"
                        name="forced_close_time"
                        value={form.forced_close_time}
                        onChange={handleChange}
                        required
                    />
                </label>

                <hr style={{ margin: '20px 0' }} />
                <h3 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
  <img
    width="27"
    height="27"
    src="https://img.icons8.com/ios/50/automatic.png"
    alt="automatic"
  />
  Auction Configuration
</h3>

                <label style={labelStyle}>
                    Trigger Window (X minutes)
                    <input
                        style={inputStyle}
                        type="number"
                        name="trigger_window_minutes"
                        value={form.trigger_window_minutes}
                        onChange={handleChange}
                        min="1"
                        required
                    />
                </label>

                <label style={labelStyle}>
                    Extension Duration (Y minutes)
                    <input
                        style={inputStyle}
                        type="number"
                        name="extension_duration_minutes"
                        value={form.extension_duration_minutes}
                        onChange={handleChange}
                        min="1"
                        required
                    />
                </label>

                <label style={labelStyle}>
                    Extension Trigger
                    <select
                        style={inputStyle}
                        name="extension_trigger"
                        value={form.extension_trigger}
                        onChange={handleChange}
                    >
                        <option value="bid_received">Bid Received in Last X Minutes</option>
                        <option value="any_rank_change">Any Supplier Rank Change</option>
                        <option value="l1_rank_change">Lowest Bidder (L1) Rank Change</option>
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#e94560',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Creating...' : 'Create RFQ'}
                </button>
            </form>
        </div>
    );
}

export default CreateRFQ;