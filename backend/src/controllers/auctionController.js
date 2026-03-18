const db = require('../config/db');

// POST /api/auctions/activate/:rfq_id
async function activateAuction(req, res) {
    try {
        const { rfq_id } = req.params;

        const [rfqs] = await db.query(
            'SELECT * FROM rfqs WHERE id = ?', [rfq_id]
        );

        if (rfqs.length === 0) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        if (rfqs[0].status !== 'draft') {
            return res.status(400).json({ error: `RFQ is already ${rfqs[0].status}` });
        }

        await db.query(
            'UPDATE rfqs SET status = ? WHERE id = ?',
            ['active', rfq_id]
        );

        await db.query(
            `INSERT INTO auction_logs (rfq_id, event_type, description)
             VALUES (?, 'bid_submitted', 'Auction activated by buyer')`,
            [rfq_id]
        );

        return res.json({ message: 'Auction activated successfully' });

    } catch (error) {
        console.error('activateAuction error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /api/auctions/close/:rfq_id
async function closeAuction(req, res) {
    try {
        const { rfq_id } = req.params;

        const [rfqs] = await db.query(
            'SELECT * FROM rfqs WHERE id = ?', [rfq_id]
        );

        if (rfqs.length === 0) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        if (rfqs[0].status === 'closed' || rfqs[0].status === 'force_closed') {
            return res.status(400).json({ error: 'Auction is already closed' });
        }

        await db.query(
            'UPDATE rfqs SET status = ? WHERE id = ?',
            ['closed', rfq_id]
        );

        await db.query(
            `INSERT INTO auction_logs (rfq_id, event_type, description)
             VALUES (?, 'auction_closed', 'Auction manually closed by buyer')`,
            [rfq_id]
        );

        return res.json({ message: 'Auction closed successfully' });

    } catch (error) {
        console.error('closeAuction error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /api/auctions/check-status/:rfq_id
// Call this periodically to auto-close expired auctions
async function checkAndUpdateStatus(req, res) {
    try {
        const { rfq_id } = req.params;

        const [rfqs] = await db.query(
            'SELECT * FROM rfqs WHERE id = ?', [rfq_id]
        );

        if (rfqs.length === 0) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        const rfq = rfqs[0];
        const now = new Date();

        if (rfq.status !== 'active') {
            return res.json({ status: rfq.status, message: 'No update needed' });
        }

        const forcedCloseTime = new Date(rfq.forced_close_time);
        const bidCloseTime = new Date(rfq.bid_close_time);

        // Force close if past forced close time
        if (now >= forcedCloseTime) {
            await db.query(
                'UPDATE rfqs SET status = ? WHERE id = ?',
                ['force_closed', rfq_id]
            );
            await db.query(
                `INSERT INTO auction_logs (rfq_id, event_type, description)
                 VALUES (?, 'force_closed', 'Auction force closed - reached forced close time')`,
                [rfq_id]
            );
            return res.json({ status: 'force_closed', message: 'Auction force closed' });
        }

        // Normal close if past bid close time
        if (now >= bidCloseTime) {
            await db.query(
                'UPDATE rfqs SET status = ? WHERE id = ?',
                ['closed', rfq_id]
            );
            await db.query(
                `INSERT INTO auction_logs (rfq_id, event_type, description)
                 VALUES (?, 'auction_closed', 'Auction closed - reached bid close time')`,
                [rfq_id]
            );
            return res.json({ status: 'closed', message: 'Auction closed' });
        }

        return res.json({
            status: rfq.status,
            message: 'Auction still active',
            bid_close_time: rfq.bid_close_time,
            forced_close_time: rfq.forced_close_time,
            time_remaining_seconds: Math.floor((bidCloseTime - now) / 1000)
        });

    } catch (error) {
        console.error('checkAndUpdateStatus error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /api/auctions/listing
async function getAuctionListing(req, res) {
    try {
        const [rows] = await db.query(
            `SELECT 
                r.id, r.reference_id, r.name, r.status,
                r.bid_close_time, r.forced_close_time,
                MIN(b.total_amount) as current_lowest_bid,
                COUNT(b.id) as total_bids
            FROM rfqs r
            LEFT JOIN bids b ON b.rfq_id = r.id
            GROUP BY r.id
            ORDER BY r.created_at DESC`
        );

        return res.json(rows);

    } catch (error) {
        console.error('getAuctionListing error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    activateAuction,
    closeAuction,
    checkAndUpdateStatus,
    getAuctionListing
};