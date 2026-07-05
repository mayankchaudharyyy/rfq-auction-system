const express = require('express');
const router = express.Router();
const { submitBid, getBidsByRFQ } = require('../controllers/bidController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/submit', restrictTo('supplier'), submitBid);
router.get('/:rfq_id', getBidsByRFQ);

module.exports = router;
