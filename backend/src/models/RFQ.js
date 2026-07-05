const mongoose = require('mongoose');

const rfqSchema = new mongoose.Schema({
    reference_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickup_service_date: { type: Date, required: true },
    bid_start_time: { type: Date, required: true },
    bid_close_time: { type: Date, required: true },
    forced_close_time: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'active', 'closed', 'force_closed'], default: 'draft' },
    auction_config: {
        trigger_window_minutes: { type: Number, required: true },
        extension_duration_minutes: { type: Number, required: true },
        extension_trigger: { type: String, enum: ['bid_received', 'any_rank_change', 'l1_rank_change'], required: true }
    },
    created_at: { type: Date, default: Date.now }
});

// Virtual for id
rfqSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

rfqSchema.set('toJSON', { virtuals: true });
rfqSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RFQ', rfqSchema);
