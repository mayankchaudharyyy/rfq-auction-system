const db = require('../config/db');

// Generate a unique reference ID like RFQ-2026-001
async function generateReferenceId() {
    const year = new Date().getFullYear();
    const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM rfqs WHERE YEAR(created_at) = ?', [year]
    );
    const count = rows[0].count + 1;
    return `RFQ-${year}-${String(count).padStart(3, '0')}`;
}

// POST /api/rfqs/create
async function createRFQ(req, res) {
    try {
        const {
            name,
            buyer_id,
            pickup_service_date,
            bid_start_time,
            bid_close_time,
            forced_close_time,
            trigger_window_minutes,
            extension_duration_minutes,
            extension_trigger
        } = req.body;

        // Validation
        if (new Date(forced_close_time) <= new Date(bid_close_time)) {
            return res.status(400).json({
                error: 'forced_close_time must be greater than bid_close_time'
            });
        }

        if (new Date(bid_close_time) <= new Date(bid_start_time)) {
            return res.status(400).json({
                error: 'bid_close_time must be greater than bid_start_time'
            });
        }

        const reference_id = await generateReferenceId();

        // Insert RFQ
        const [rfqResult] = await db.query(
            `INSERT INTO rfqs 
            (reference_id, name, buyer_id, pickup_service_date, bid_start_time, bid_close_time, forced_close_time, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
            [reference_id, name, buyer_id, pickup_service_date, bid_start_time, bid_close_time, forced_close_time]
        );

        const rfq_id = rfqResult.insertId;

        // Insert Auction Config
        await db.query(
            `INSERT INTO auction_configs 
            (rfq_id, trigger_window_minutes, extension_duration_minutes, extension_trigger) 
            VALUES (?, ?, ?, ?)`,
            [rfq_id, trigger_window_minutes, extension_duration_minutes, extension_trigger]
        );

        return res.status(201).json({
            message: 'RFQ created successfully',
            rfq_id,
            reference_id
        });

    } catch (error) {
        console.error('createRFQ error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /api/rfqs
async function getAllRFQs(req, res) {
    try {
        const [rows] = await db.query(
            `SELECT 
                r.id, r.reference_id, r.name, r.status,
                r.bid_close_time, r.forced_close_time,
                MIN(b.total_amount) as current_lowest_bid
            FROM rfqs r
            LEFT JOIN bids b ON b.rfq_id = r.id
            GROUP BY r.id
            ORDER BY r.created_at DESC`
        );

        return res.json(rows);
    } catch (error) {
        console.error('getAllRFQs error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /api/rfqs/:id
async function getRFQById(req, res) {
    try {
        const { id } = req.params;

        // Get RFQ details
        const [rfqs] = await db.query(
            `SELECT r.*, u.name as buyer_name 
             FROM rfqs r
             JOIN users u ON u.id = r.buyer_id
             WHERE r.id = ?`, [id]
        );

        if (rfqs.length === 0) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        // Get auction config
        const [configs] = await db.query(
            'SELECT * FROM auction_configs WHERE rfq_id = ?', [id]
        );

        // Get all bids sorted by total_amount
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
    ORDER BY b.total_amount ASC`, [id, id]
);

        // Get activity log
        const [logs] = await db.query(
            'SELECT * FROM auction_logs WHERE rfq_id = ? ORDER BY created_at ASC', [id]
        );

        return res.json({
            rfq: rfqs[0],
            auction_config: configs[0],
            bids,
            activity_log: logs
        });

    } catch (error) {
        console.error('getRFQById error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { createRFQ, getAllRFQs, getRFQById };