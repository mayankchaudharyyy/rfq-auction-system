const RFQ = require('../models/RFQ');
const AuctionLog = require('../models/AuctionLog');
const { getRankedBids } = require('./bidController');

// Generate unique reference ID like RFQ-2026-001
async function generateReferenceId() {
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    const count = await RFQ.countDocuments({
        created_at: { $gte: startOfYear, $lt: endOfYear }
    });
    return `RFQ-${year}-${String(count + 1).padStart(3, '0')}`;
}

// POST /api/rfqs/create  [buyer only]
async function createRFQ(req, res) {
    try {
        const {
            name,
            pickup_service_date,
            bid_start_time,
            bid_close_time,
            forced_close_time,
            trigger_window_minutes,
            extension_duration_minutes,
            extension_trigger
        } = req.body;

        if (new Date(forced_close_time) <= new Date(bid_close_time)) {
            return res.status(400).json({ error: 'Forced close time must be after bid close time.' });
        }
        if (new Date(bid_close_time) <= new Date(bid_start_time)) {
            return res.status(400).json({ error: 'Bid close time must be after bid start time.' });
        }

        const reference_id = await generateReferenceId();

        const newRFQ = await RFQ.create({
            reference_id,
            name,
            buyer_id: req.user._id,   // from JWT
            pickup_service_date,
            bid_start_time,
            bid_close_time,
            forced_close_time,
            status: 'draft',
            auction_config: {
                trigger_window_minutes: Number(trigger_window_minutes),
                extension_duration_minutes: Number(extension_duration_minutes),
                extension_trigger
            }
        });

        return res.status(201).json({
            message: 'RFQ created successfully.',
            rfq_id: newRFQ._id,
            reference_id
        });
    } catch (error) {
        console.error('createRFQ error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join('. ') });
        }
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

// GET /api/rfqs/my  [buyer only — their own RFQs]
async function getMyRFQs(req, res) {
    try {
        const rfqs = await RFQ.aggregate([
            { $match: { buyer_id: req.user._id } },
            {
                $lookup: {
                    from: 'bids',
                    localField: '_id',
                    foreignField: 'rfq_id',
                    as: 'bids'
                }
            },
            {
                $project: {
                    id: '$_id',
                    reference_id: 1,
                    name: 1,
                    status: 1,
                    bid_start_time: 1,
                    bid_close_time: 1,
                    forced_close_time: 1,
                    created_at: 1,
                    current_lowest_bid: { $min: '$bids.total_amount' },
                    total_bids: { $size: '$bids' }
                }
            },
            { $sort: { created_at: -1 } }
        ]);
        return res.json(rfqs);
    } catch (error) {
        console.error('getMyRFQs error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

// GET /api/rfqs/active  [supplier only — active and closed RFQs visible to suppliers]
async function getActiveRFQs(req, res) {
    try {
        const rfqs = await RFQ.aggregate([
            { $match: { status: { $in: ['active', 'closed', 'force_closed'] } } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'buyer_id',
                    foreignField: '_id',
                    as: 'buyer'
                }
            },
            {
                $lookup: {
                    from: 'bids',
                    localField: '_id',
                    foreignField: 'rfq_id',
                    as: 'bids'
                }
            },
            {
                $project: {
                    id: '$_id',
                    reference_id: 1,
                    name: 1,
                    status: 1,
                    bid_start_time: 1,
                    bid_close_time: 1,
                    forced_close_time: 1,
                    pickup_service_date: 1,
                    created_at: 1,
                    buyer_company: { $arrayElemAt: ['$buyer.company_name', 0] },
                    total_bids: { $size: '$bids' },
                    current_lowest_bid: { $min: '$bids.total_amount' },
                    status_order: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$status', 'active'] }, then: 1 },
                                { case: { $eq: ['$status', 'closed'] }, then: 2 },
                                { case: { $eq: ['$status', 'force_closed'] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },
            { $sort: { status_order: 1, bid_close_time: 1 } },
            { $project: { status_order: 0 } }
        ]);
        return res.json(rfqs);
    } catch (error) {
        console.error('getActiveRFQs error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

// GET /api/rfqs/:id  [both roles]
async function getRFQById(req, res) {
    try {
        const { id } = req.params;
        const rfq = await RFQ.findById(id).populate('buyer_id', 'name company_name email');

        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found.' });
        }

        if (req.user.role === 'buyer' && rfq.buyer_id._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only view your own RFQs.' });
        }

        // Supplier can only view active/closed rfqs
        if (req.user.role === 'supplier' && !['active', 'closed', 'force_closed'].includes(rfq.status)) {
            return res.status(403).json({ error: 'This RFQ is not yet open for bidding.' });
        }

        const isBuyer = req.user.role === 'buyer';
        const rankedBids = await getRankedBids(id, req.user);

        const logs = await AuctionLog.find({ rfq_id: rfq._id }).sort({ created_at: 1 });

        return res.json({
            rfq: {
                ...rfq.toObject(),
                buyer_name: rfq.buyer_id ? rfq.buyer_id.company_name || rfq.buyer_id.name : 'Unknown',
                buyer_email: rfq.buyer_id ? rfq.buyer_id.email : null
            },
            auction_config: rfq.auction_config,
            bids: rankedBids,
            activity_log: logs,
            user_role: req.user.role,
            is_buyer: isBuyer
        });
    } catch (error) {
        console.error('getRFQById error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

module.exports = { createRFQ, getMyRFQs, getActiveRFQs, getRFQById };
