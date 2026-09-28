const express = require('express');
const router = express.Router();
const {
  getNotifications,
  streamNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Realtime Server-Sent Events (SSE) Stream
router.get('/stream', streamNotifications);

router.get('/', getNotifications);

// Mark all as read (support all common methods/paths)
router.put('/read-all', markAllAsRead);
router.post('/read-all', markAllAsRead);
router.put('/mark-read', markAllAsRead);
router.post('/mark-read', markAllAsRead);

// Clear all notifications
router.delete('/', clearAllNotifications);
router.delete('/clear-all', clearAllNotifications);

// Single notification routes
router.put('/:id/read', markAsRead);
router.post('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
