const db = require('../config/db');

async function processAuctionExtension(rfq_id, new_bid_id) {
    try {
        // Get RFQ details
        const [rfqs] = await db.query(
            'SELECT * FROM rfqs WHERE id = ?', [rfq_id]
        );
        const rfq = rfqs[0];

        // If auction is not active, do nothing
        if (rfq.status !== 'active') return;

        const now = new Date();
        const bidCloseTime = new Date(rfq.bid_close_time);
        const forcedCloseTime = new Date(rfq.forced_close_time);

        // If already past forced close time, force close and stop
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
            return;
        }

        // Get auction config
        const [configs] = await db.query(
            'SELECT * FROM auction_configs WHERE rfq_id = ?', [rfq_id]
        );
        const config = configs[0];

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
        await db.query(
            'UPDATE rfqs SET bid_close_time = ? WHERE id = ?',
            [newCloseTime, rfq_id]
        );

        // Log the extension
        await db.query(
            `INSERT INTO auction_logs 
            (rfq_id, event_type, description, old_close_time, new_close_time, triggered_by_bid_id)
            VALUES (?, 'time_extended', ?, ?, ?, ?)`,
            [rfq_id, extensionReason, oldCloseTime, newCloseTime, new_bid_id]
        );

        console.log(`Auction ${rfq_id} extended from ${oldCloseTime} to ${newCloseTime}`);

    } catch (error) {
        console.error('auctionEngine error:', error);
    }
}

// Check if any supplier ranking changed after new bid
async function checkIfRankChanged(rfq_id, new_bid_id) {
    // Get the new bid details
    const [newBids] = await db.query(
        'SELECT * FROM bids WHERE id = ?', [new_bid_id]
    );
    const newBid = newBids[0];

    // Count how many bids have lower total than this new bid
    const [rows] = await db.query(
        `SELECT COUNT(*) as count FROM bids 
         WHERE rfq_id = ? AND total_amount < ? AND id != ?`,
        [rfq_id, newBid.total_amount, new_bid_id]
    );

    // If this bid is not last place, rankings changed
    const totalBids = await db.query(
        'SELECT COUNT(*) as count FROM bids WHERE rfq_id = ?', [rfq_id]
    );
    const total = totalBids[0][0].count;
    const lowerCount = rows[0].count;

    // If new bid is not the highest price, it displaced someone = rank changed
    return lowerCount < total - 1;
}

// Check if L1 (lowest bidder) changed after new bid
async function checkIfL1Changed(rfq_id, new_bid_id) {
    // Get the new bid
    const [newBids] = await db.query(
        'SELECT * FROM bids WHERE id = ?', [new_bid_id]
    );
    const newBid = newBids[0];

    // Get current lowest bid excluding this new bid
    const [prevLowest] = await db.query(
        `SELECT MIN(total_amount) as min_amount 
         FROM bids WHERE rfq_id = ? AND id != ?`,
        [rfq_id, new_bid_id]
    );

    const prevL1 = prevLowest[0].min_amount;

    // If new bid is lower than previous L1, L1 changed
    if (prevL1 === null) return false; // first bid ever
    return newBid.total_amount < prevL1;
}

module.exports = { processAuctionExtension };