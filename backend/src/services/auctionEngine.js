const RFQ = require('../models/RFQ');
const Bid = require('../models/Bid');
const AuctionLog = require('../models/AuctionLog');

async function processAuctionExtension(rfq_id, new_bid_id) {
    try {
        // Get RFQ details
        const rfq = await RFQ.findById(rfq_id);
        
        if (!rfq) return;

        // If auction is not active, do nothing
        if (rfq.status !== 'active') return;

        const now = new Date();
        const bidCloseTime = new Date(rfq.bid_close_time);
        const forcedCloseTime = new Date(rfq.forced_close_time);

        // If already past forced close time, force close and stop
        if (now >= forcedCloseTime) {
            rfq.status = 'force_closed';
            await rfq.save();

            await AuctionLog.create({
                rfq_id,
                event_type: 'force_closed',
                description: 'Auction force closed - reached forced close time'
            });
            return;
        }

        const config = rfq.auction_config;
        if (!config) return;

        const triggerWindowMs = config.trigger_window_minutes * 60 * 1000;
        const extensionMs = config.extension_duration_minutes * 60 * 1000;

        // Check if bid was placed within trigger window
        const windowStart = new Date(bidCloseTime.getTime() - triggerWindowMs);
        const isInTriggerWindow = now >= windowStart && now <= bidCloseTime;

        if (!isInTriggerWindow) return;

        // Check extension trigger type
        let shouldExtend = false;
        let extensionReason = '';

        if (config.extension_trigger === 'bid_received') {
            // Any bid in trigger window = extend
            shouldExtend = true;
            extensionReason = `New bid received within last ${config.trigger_window_minutes} minutes`;

        } else if (config.extension_trigger === 'any_rank_change') {
            // Check if rankings changed after this new bid
            const rankChanged = await checkIfRankChanged(rfq_id, new_bid_id);
            if (rankChanged) {
                shouldExtend = true;
                extensionReason = `Supplier ranking changed within last ${config.trigger_window_minutes} minutes`;
            }

        } else if (config.extension_trigger === 'l1_rank_change') {
            // Check if L1 (lowest bidder) changed
            const l1Changed = await checkIfL1Changed(rfq_id, new_bid_id);
            if (l1Changed) {
                shouldExtend = true;
                extensionReason = `L1 (lowest bidder) changed within last ${config.trigger_window_minutes} minutes`;
            }
        }

        if (!shouldExtend) return;

        // Calculate new close time
        let newCloseTime = new Date(bidCloseTime.getTime() + extensionMs);

        // NEVER exceed forced close time
        if (newCloseTime > forcedCloseTime) {
            newCloseTime = forcedCloseTime;
        }

        const oldCloseTime = bidCloseTime;

        // Update bid_close_time in rfqs
        rfq.bid_close_time = newCloseTime;
        await rfq.save();

        // Log the extension
        await AuctionLog.create({
            rfq_id,
            event_type: 'time_extended',
            description: extensionReason,
            old_close_time: oldCloseTime,
            new_close_time: newCloseTime,
            triggered_by_bid_id: new_bid_id
        });

        console.log(`Auction ${rfq_id} extended from ${oldCloseTime} to ${newCloseTime}`);

    } catch (error) {
        console.error('auctionEngine error:', error);
    }
}

// Check if any supplier ranking changed after new bid
async function checkIfRankChanged(rfq_id, new_bid_id) {
    const newBid = await Bid.findById(new_bid_id);
    if (!newBid) return false;

    // Count how many bids have lower total than this new bid
    const lowerCount = await Bid.countDocuments({
        rfq_id,
        total_amount: { $lt: newBid.total_amount },
        _id: { $ne: newBid._id }
    });

    const total = await Bid.countDocuments({ rfq_id });

    // If new bid is not the highest price, it displaced someone = rank changed
    return lowerCount < total - 1;
}

// Check if L1 (lowest bidder) changed after new bid
async function checkIfL1Changed(rfq_id, new_bid_id) {
    const newBid = await Bid.findById(new_bid_id);
    if (!newBid) return false;

    // Get current lowest bid excluding this new bid
    const prevLowest = await Bid.findOne({
        rfq_id,
        _id: { $ne: newBid._id }
    }).sort({ total_amount: 1 });

    // If new bid is lower than previous L1, L1 changed
    if (!prevLowest) return false; // first bid ever
    return newBid.total_amount < prevLowest.total_amount;
}

module.exports = { processAuctionExtension };