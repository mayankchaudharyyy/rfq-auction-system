const db = require('../config/db');
const { processAuctionExtension } = require('../services/auctionEngine');

// POST /api/bids/submit
async function submitBid(req, res) {
    try {
        const {
            rfq_id,
            supplier_id,
            carrier_name,
            freight_charges,
            origin_charges,
            destination_charges,
            transit_time,
            quote_validity
        } = req.body;

        // Get RFQ
        const [rfqs] = await db.query(
            'SELECT * FROM rfqs WHERE id = ?', [rfq_id]
        );

        if (rfqs.length === 0) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        const rfq = rfqs[0];
        const now = new Date();

        // Check if auction is active
        if (rfq.status !== 'active') {
            return res.status(400).json({ error: `Auction is ${rfq.status}. Bids not accepted.` });
        }

        // Check if within bid window
        if (now < new Date(rfq.bid_start_time)) {
            return res.status(400).json({ error: 'Auction has not started yet' });
        }

        if (now > new Date(rfq.forced_close_time)) {
            return res.status(400).json({ error: 'Auction is past forced close time' });
        }

        if (now > new Date(rfq.bid_close_time)) {
            return res.status(400).json({ error: 'Auction bid time has closed' });
        }

        // Insert the bid
        const [result] = await db.query(
            `INSERT INTO bids 
            (rfq_id, supplier_id, carrier_name, freight_charges, origin_charges, destination_charges, transit_time, quote_validity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [rfq_id, supplier_id, carrier_name, freight_charges, origin_charges || 0, destination_charges || 0, transit_time, quote_validity]
        );

        const bid_id = result.insertId;

        // Log the bid submission
        await db.query(
            `INSERT INTO auction_logs (rfq_id, event_type, description, triggered_by_bid_id)
             VALUES (?, 'bid_submitted', ?, ?)`,
            [rfq_id, `Bid submitted by supplier_id ${supplier_id}`, bid_id]
        );

        // Run auction engine to check if extension needed
        await processAuctionExtension(rfq_id, bid_id);

        // Return updated RFQ close time
        const [updatedRfq] = await db.query(
            'SELECT bid_close_time, forced_close_time, status FROM rfqs WHERE id = ?',
            [rfq_id]
        );

        return res.status(201).json({
            message: 'Bid submitted successfully',
            bid_id,
            current_bid_close_time: updatedRfq[0].bid_close_time,
            forced_close_time: updatedRfq[0].forced_close_time
        });

    } catch (error) {
        console.error('submitBid error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /api/bids/:rfq_id
async function getBidsByRFQ(req, res) {
    try {
        const { rfq_id } = req.params;

       const [bids] = await db.query(
    `SELECT b.*, u.name as supplier_name,
        RANK() OVER (ORDER BY b.total_amount ASC) as ranking
     FROM bids b
     JOIN users u ON u.id = b.supplier_id
     WHERE b.rfq_id = ?
     AND b.id IN (
         SELECT MAX(id) FROM bids
         WHERE rfq_id = ?
         GROUP BY supplier_id
     )
     ORDER BY b.total_amount ASC`,
    [rfq_id, rfq_id]
);

        return res.json(bids);
    } catch (error) {
        console.error('getBidsByRFQ error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { submitBid, getBidsByRFQ };