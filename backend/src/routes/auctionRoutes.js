const express = require('express');
const router = express.Router();
const {
    activateAuction,
    closeAuction,
    checkAndUpdateStatus,
    getAuctionListing
} = require('../controllers/auctionController');

router.get('/listing', getAuctionListing);
router.post('/activate/:rfq_id', activateAuction);
router.post('/close/:rfq_id', closeAuction);
router.post('/check-status/:rfq_id', checkAndUpdateStatus);

module.exports = router;