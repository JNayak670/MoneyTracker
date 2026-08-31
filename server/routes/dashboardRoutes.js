const express = require('express');
const router = express.Router();
const { getSummary, getAnalytics } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getSummary);
router.get('/analytics', getAnalytics);

module.exports = router;
