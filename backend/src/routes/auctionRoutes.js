const express = require('express');
const router = express.Router();
const {
    activateAuction,
    closeAuction,
    checkAndUpdateStatus,
    selectWinner
} = require('../controllers/auctionController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/activate/:rfq_id', restrictTo('buyer'), activateAuction);
router.post('/close/:rfq_id', restrictTo('buyer'), closeAuction);
router.post('/select-winner/:rfq_id/:bid_id', restrictTo('buyer'), selectWinner);
router.post('/check-status/:rfq_id', checkAndUpdateStatus);

module.exports = router;
