const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { getGroupSplitDetails } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// Generate share code (protected)
router.post('/generate', protect, shareController.generateShareCode);

// Public access to group split details for shared ledger view (must be before /:code)
router.get('/group/:splitGroupId', getGroupSplitDetails);

// Public access to shared ledger (no auth required)
router.get('/:code', shareController.getSharedLedger);

module.exports = router;
