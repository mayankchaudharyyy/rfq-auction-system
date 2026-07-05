const RFQ = require('../models/RFQ');
const AuctionLog = require('../models/AuctionLog');
const Bid = require('../models/Bid');

function emitAuctionUpdate(req, rfqId, event, payload = {}) {
    const io = req.app.get('io');
    if (io) {
        io.to(`rfq:${rfqId}`).emit(event, { rfq_id: rfqId, ...payload });
        io.emit('auction_list_updated', { rfq_id: rfqId, ...payload });
    }
}

function assertBuyerOwnsRFQ(req, rfq) {
    return rfq.buyer_id.toString() === req.user._id.toString();
}

// POST /api/auctions/activate/:rfq_id
async function activateAuction(req, res) {
    try {
        const { rfq_id } = req.params;

        const rfq = await RFQ.findById(rfq_id);

        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        if (!assertBuyerOwnsRFQ(req, rfq)) {
            return res.status(403).json({ error: 'You can only manage auctions for your own RFQs.' });
        }

        if (rfq.status !== 'draft') {
            return res.status(400).json({ error: `RFQ is already ${rfq.status}` });
        }

        rfq.status = 'active';
        await rfq.save();

        await AuctionLog.create({
            rfq_id: rfq._id,
            event_type: 'bid_submitted',
            description: 'Auction activated by buyer'
        });

        emitAuctionUpdate(req, rfq_id, 'auction_status_changed', { status: rfq.status });

        return res.json({ message: 'Auction activated successfully', rfq });

    } catch (error) {
        console.error('activateAuction error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /api/auctions/close/:rfq_id
async function closeAuction(req, res) {
    try {
        const { rfq_id } = req.params;

        const rfq = await RFQ.findById(rfq_id);

        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        if (!assertBuyerOwnsRFQ(req, rfq)) {
            return res.status(403).json({ error: 'You can only manage auctions for your own RFQs.' });
        }

        if (rfq.status === 'closed' || rfq.status === 'force_closed') {
            return res.status(400).json({ error: 'Auction is already closed' });
        }

        rfq.status = 'closed';
        await rfq.save();

        await AuctionLog.create({
            rfq_id: rfq._id,
            event_type: 'auction_closed',
            description: 'Auction manually closed by buyer'
        });

        emitAuctionUpdate(req, rfq_id, 'auction_status_changed', { status: rfq.status });

        return res.json({ message: 'Auction closed successfully', rfq });

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

        const rfq = await RFQ.findById(rfq_id);

        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        if (req.user.role === 'buyer' && !assertBuyerOwnsRFQ(req, rfq)) {
            return res.status(403).json({ error: 'You can only check auctions for your own RFQs.' });
        }

        const now = new Date();

        if (rfq.status !== 'active') {
            return res.json({ status: rfq.status, message: 'No update needed' });
        }

        const forcedCloseTime = new Date(rfq.forced_close_time);
        const bidCloseTime = new Date(rfq.bid_close_time);

        // Force close if past forced close time
        if (now >= forcedCloseTime) {
            rfq.status = 'force_closed';
            await rfq.save();

            await AuctionLog.create({
                rfq_id: rfq._id,
                event_type: 'force_closed',
                description: 'Auction force closed - reached forced close time'
            });
            emitAuctionUpdate(req, rfq_id, 'auction_status_changed', { status: rfq.status });
            return res.json({ status: 'force_closed', message: 'Auction force closed' });
        }

        // Normal close if past bid close time
        if (now >= bidCloseTime) {
            rfq.status = 'closed';
            await rfq.save();

            await AuctionLog.create({
                rfq_id: rfq._id,
                event_type: 'auction_closed',
                description: 'Auction closed - reached bid close time'
            });
            emitAuctionUpdate(req, rfq_id, 'auction_status_changed', { status: rfq.status });
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

// POST /api/auctions/select-winner/:rfq_id/:bid_id
async function selectWinner(req, res) {
    try {
        const { rfq_id, bid_id } = req.params;
        const rfq = await RFQ.findById(rfq_id);

        if (!rfq) {
            return res.status(404).json({ error: 'RFQ not found' });
        }

        if (!assertBuyerOwnsRFQ(req, rfq)) {
            return res.status(403).json({ error: 'You can only select winners for your own RFQs.' });
        }

        const bid = await Bid.findOne({ _id: bid_id, rfq_id });
        if (!bid) {
            return res.status(404).json({ error: 'Bid not found for this RFQ.' });
        }

        await Bid.updateMany({ rfq_id }, { winner: false });
        bid.winner = true;
        await bid.save();

        rfq.status = 'closed';
        await rfq.save();

        await AuctionLog.create({
            rfq_id,
            event_type: 'winner_selected',
            description: 'Buyer selected a winning supplier',
            triggered_by_bid_id: bid._id
        });

        emitAuctionUpdate(req, rfq_id, 'winner_selected', { bid_id: bid._id, status: rfq.status });

        return res.json({ message: 'Winner selected successfully', bid_id: bid._id, rfq });

    } catch (error) {
        console.error('selectWinner error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    activateAuction,
    closeAuction,
    checkAndUpdateStatus,
    selectWinner
};
