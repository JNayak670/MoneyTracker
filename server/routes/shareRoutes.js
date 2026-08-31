const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

// Generate share code (protected)
router.post('/generate', protect, shareController.generateShareCode);

// Public access to shared ledger (no auth required)
router.get('/:code', shareController.getSharedLedger);

module.exports = router;
