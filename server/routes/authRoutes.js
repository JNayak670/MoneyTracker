const express = require('express');
const router = express.Router();
const { register, login, getMe, updateSettings, changePin, checkUsername } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/check-username', checkUsername);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/settings', protect, updateSettings);
router.put('/change-pin', protect, changePin);

module.exports = router;

