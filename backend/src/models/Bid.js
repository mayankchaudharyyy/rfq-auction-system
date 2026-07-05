const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    rfq_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
    supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    carrier_name: { type: String, required: true },
    freight_charges: { type: Number, required: true },
    origin_charges: { type: Number, default: 0 },
    destination_charges: { type: Number, default: 0 },
    transit_time: { type: String, required: true },
    quote_validity: { type: String, required: true },
    total_amount: { type: Number },
    winner: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

// Calculate total_amount before saving
bidSchema.pre('save', async function() {
    this.total_amount = (this.freight_charges || 0) + (this.origin_charges || 0) + (this.destination_charges || 0);
});

bidSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

bidSchema.set('toJSON', { virtuals: true });
bidSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bid', bidSchema);
