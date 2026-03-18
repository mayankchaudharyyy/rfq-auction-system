const express = require('express');
const router = express.Router();
const { submitBid, getBidsByRFQ } = require('../controllers/bidController');

router.post('/submit', submitBid);
router.get('/:rfq_id', getBidsByRFQ);

module.exports = router;