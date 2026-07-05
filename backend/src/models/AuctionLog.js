const mongoose = require('mongoose');

const auctionLogSchema = new mongoose.Schema({
    rfq_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
    event_type: { type: String, required: true },
    description: { type: String, required: true },
    old_close_time: { type: Date },
    new_close_time: { type: Date },
    triggered_by_bid_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
    created_at: { type: Date, default: Date.now }
});

// Virtual for id
auctionLogSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

auctionLogSchema.set('toJSON', { virtuals: true });
auctionLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AuctionLog', auctionLogSchema);
