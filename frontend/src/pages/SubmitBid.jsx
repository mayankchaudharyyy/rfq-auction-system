import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

function SubmitBid() {
    const { rfq_id } = useParams();
    const navigate = useNavigate();
    const [rfq, setRfq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        supplier_id: 2,
        carrier_name: '',
        freight_charges: '',
        origin_charges: '',
        destination_charges: '',
        transit_time: '',
        quote_validity: ''
    });

    useEffect(() => {
        async function fetchRFQ() {
            try {
                const res = await API.get(`/rfqs/${rfq_id}`);
                setRfq(res.data.rfq);
            } catch (err) {
                console.error('Failed to fetch RFQ:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchRFQ();
    }, [rfq_id]);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const payload = {
                rfq_id: parseInt(rfq_id),
                supplier_id: parseInt(form.supplier_id),
                carrier_name: form.carrier_name,
                freight_charges: parseFloat(form.freight_charges),
                origin_charges: parseFloat(form.origin_charges) || 0,
                destination_charges: parseFloat(form.destination_charges) || 0,
                transit_time: parseInt(form.transit_time),
                quote_validity: form.quote_validity
            };

            const res = await API.post('/bids/submit', payload);

            const newCloseTime = new Date(res.data.current_bid_close_time).toLocaleString();
            setSuccess(` Bid submitted! Current close time: ${newCloseTime}`);

            // Reset form
            setForm({
                supplier_id: form.supplier_id,
                carrier_name: '',
                freight_charges: '',
                origin_charges: '',
                destination_charges: '',
                transit_time: '',
                quote_validity: ''
            });

        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    }

    const totalAmount =
        (parseFloat(form.freight_charges) || 0) +
        (parseFloat(form.origin_charges) || 0) +
        (parseFloat(form.destination_charges) || 0);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!rfq) return <div style={{ padding: '40px' }}>RFQ not found.</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

            {/* Back button */}
            <button
                onClick={() => navigate(`/auction/${rfq_id}`)}
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
                ← Back to Auction
            </button>

            {/* RFQ Info */}
            <div style={{
                backgroundColor: '#1a1a2e',
                color: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '24px'
            }}>
                <h3 style={{ margin: 0 }}>{rfq.name}</h3>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#aaa' }}>
                    {rfq.reference_id} • Close: {new Date(rfq.bid_close_time).toLocaleString()}
                </p>
            </div>

            <h2 style={{ marginBottom: '20px' }}>Submit Your Quote</h2>

            {/* Error */}
            {error && (
                <div style={{
                    backgroundColor: '#ffe0e0',
                    color: '#cc0000',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px'
                }}>
                     {error}
                </div>
            )}

            {/* Success */}
            {success && (
                <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px'
                }}>
                    {success}
                    <br />
                    <button
                        onClick={() => navigate(`/auction/${rfq_id}`)}
                        style={{
                            marginTop: '8px',
                            padding: '6px 14px',
                            backgroundColor: '#155724',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        View Auction
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit}>

                {/* Supplier selector */}
                <label style={labelStyle}>
                    Supplier
                    <select
                        style={inputStyle}
                        name="supplier_id"
                        value={form.supplier_id}
                        onChange={handleChange}
                    >
                        <option value={2}>Supplier One</option>
                        <option value={3}>Supplier Two</option>
                        <option value={4}>Supplier Three</option>
                    </select>
                </label>

                <label style={labelStyle}>
                    Carrier Name
                    <input
                        style={inputStyle}
                        name="carrier_name"
                        value={form.carrier_name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Fast Freight Co"
                    />
                </label>

                {/* Charges */}
                <div style={{
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '15px'
                }}>
                    <h4 style={{ margin: '0 0 12px' }}>💰 Charges (₹)</h4>

                    <label style={labelStyle}>
                        Freight Charges *
                        <input
                            style={inputStyle}
                            type="number"
                            name="freight_charges"
                            value={form.freight_charges}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="0"
                        />
                    </label>

                    <label style={labelStyle}>
                        Origin Charges
                        <input
                            style={inputStyle}
                            type="number"
                            name="origin_charges"
                            value={form.origin_charges}
                            onChange={handleChange}
                            min="0"
                            placeholder="0"
                        />
                    </label>

                    <label style={labelStyle}>
                        Destination Charges
                        <input
                            style={inputStyle}
                            type="number"
                            name="destination_charges"
                            value={form.destination_charges}
                            onChange={handleChange}
                            min="0"
                            placeholder="0"
                        />
                    </label>

                    {/* Live total */}
                    <div style={{
                        backgroundColor: '#1a1a2e',
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 'bold'
                    }}>
                        <span>Total Amount</span>
                        <span>₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <label style={labelStyle}>
                    Transit Time (days)
                    <input
                        style={inputStyle}
                        type="number"
                        name="transit_time"
                        value={form.transit_time}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="e.g. 3"
                    />
                </label>

                <label style={labelStyle}>
                    Quote Validity
                    <input
                        style={inputStyle}
                        type="date"
                        name="quote_validity"
                        value={form.quote_validity}
                        onChange={handleChange}
                        required
                    />
                </label>

                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#e94560',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        marginTop: '8px'
                    }}
                >
                    {submitting ? 'Submitting...' : 'Submit Bid'}
                </button>
            </form>
        </div>
    );
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

export default SubmitBid;
