const express = require('express');
const router = express.Router();
const { register, login, getMe, updateSettings, changePin, checkUsername } = require('../controllers/authController');
const { User } = require('../db');
const { protect, activeUsersCache, clearUserAuthCache } = require('../middleware/authMiddleware');

router.get('/check-username', checkUsername);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/heartbeat', protect, (req, res) => res.json({ success: true, timestamp: Date.now() }));
router.post('/logout', protect, async (req, res) => {
  try {
    if (req.user?._id) {
      const pastTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes in the past
      await User.updateOne({ _id: req.user._id }, { $set: { lastActiveAt: pastTime } });
      activeUsersCache.delete(req.user._id.toString());
      clearUserAuthCache(req.user._id);
    }
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.put('/settings', protect, updateSettings);
router.put('/change-pin', protect, changePin);

module.exports = router;

