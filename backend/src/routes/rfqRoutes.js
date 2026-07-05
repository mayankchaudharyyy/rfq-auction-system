const express = require('express');
const router = express.Router();
const { createRFQ, getMyRFQs, getActiveRFQs, getRFQById } = require('../controllers/rfqController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/create', restrictTo('buyer'), createRFQ);
router.get('/my', restrictTo('buyer'), getMyRFQs);
router.get('/active', restrictTo('supplier'), getActiveRFQs);
router.get('/:id', getRFQById);

module.exports = router;