const mongoose = require('mongoose');
const RFQ = require('../models/RFQ');
const Bid = require('../models/Bid');
const AuctionLog = require('../models/AuctionLog');
const { processAuctionExtension } = require('../services/auctionEngine');

async function getRankedBids(rfq_id, viewer) {
    const bids = await Bid.aggregate([
        { $match: { rfq_id: new mongoose.Types.ObjectId(rfq_id) } },
        { $sort: { created_at: -1 } },
        {
            $group: {
                _id: '$supplier_id',
                latestBid: { $first: '$$ROOT' }
            }
        },
        { $replaceRoot: { newRoot: '$latestBid' } },
        { $sort: { total_amount: 1 } }
    ]);

    const populatedBids = await Bid.populate(bids, { path: 'supplier_id', select: 'name company_name' });
    const isBuyer = viewer?.role === 'buyer';

    return populatedBids.map((bid, index) => {
        const isOwn = viewer && bid.supplier_id && bid.supplier_id._id.toString() === viewer._id.toString();
        return {
            ...bid,
            id: bid._id.toString(),
            ranking: index + 1,
            supplier_name: isBuyer
                ? (bid.supplier_id ? bid.supplier_id.company_name || bid.supplier_id.name : 'Unknown Supplier')
                : (isOwn ? 'Your Bid' : `Supplier ${index + 1}`),
            is_own_bid: Boolean(isOwn)
        };
    });
}

// POST /api/bids/submit
async function submitBid(req, res) {
    try {
        const {
            rfq_id,
            carrier_name,
            freight_charges,
            origin_charges,
            destination_charges,
            transit_time,
            quote_validity
        } = req.body;

        // Get RFQ
        const rfq = await RFQ.findById(rfq_id);

        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

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
        const newBid = await Bid.create({
            rfq_id,
            supplier_id: req.user._id,
            carrier_name,
            freight_charges,
            origin_charges: origin_charges || 0,
            destination_charges: destination_charges || 0,
            transit_time,
            quote_validity
        });

        // Log the bid submission
        await AuctionLog.create({
            rfq_id,
            event_type: 'bid_submitted',
            description: `Bid submitted by ${req.user.company_name || req.user.name}`,
            triggered_by_bid_id: newBid._id
        });

        // Run auction engine to check if extension needed
        await processAuctionExtension(rfq_id, newBid._id);

        // Return updated RFQ close time
        const updatedRfq = await RFQ.findById(rfq_id).select('bid_close_time forced_close_time status');
        const rankings = await getRankedBids(rfq_id, req.user);
        const io = req.app.get('io');

        if (io) {
            io.to(`rfq:${rfq_id}`).emit('bid_rankings_updated', {
                rfq_id,
                bids: rankings,
                bid_close_time: updatedRfq.bid_close_time,
                forced_close_time: updatedRfq.forced_close_time,
                status: updatedRfq.status
            });
            io.emit('auction_list_updated', { rfq_id });
        }

        return res.status(201).json({
            message: 'Bid submitted successfully',
            bid_id: newBid._id,
            current_bid_close_time: updatedRfq.bid_close_time,
            forced_close_time: updatedRfq.forced_close_time,
            bids: rankings
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

        const rfq = await RFQ.findById(rfq_id);
        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found.' });
        }

        if (req.user.role === 'buyer' && rfq.buyer_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only view bids for your own RFQs.' });
        }

        const rankedBids = await getRankedBids(rfq_id, req.user);

        return res.json(rankedBids);
    } catch (error) {
        console.error('getBidsByRFQ error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { submitBid, getBidsByRFQ, getRankedBids };
