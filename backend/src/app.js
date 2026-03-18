const express = require('express');
const cors = require('cors');

const rfqRoutes = require('./routes/rfqRoutes');
const bidRoutes = require('./routes/bidRoutes');
const auctionRoutes = require('./routes/auctionRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rfqs', rfqRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/auctions', auctionRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'RFQ Auction API is running' });
});

module.exports = app;