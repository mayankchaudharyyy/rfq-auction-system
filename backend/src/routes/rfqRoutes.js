const express = require('express');
const router = express.Router();
const { createRFQ, getAllRFQs, getRFQById } = require('../controllers/rfqController');

router.post('/create', createRFQ);
router.get('/', getAllRFQs);
router.get('/:id', getRFQById);

module.exports = router;