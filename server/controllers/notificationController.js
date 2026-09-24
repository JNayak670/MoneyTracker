const { Notification } = require('../db');

// @route   GET /api/notifications
// @desc    Get all notifications for logged-in user with unread count
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Parallel fetch: feed and unread count execute concurrently using compound indexes
    const [rawNotifications, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    const notifications = rawNotifications.map(n => ({
      ...n,
      id: n._id ? n._id.toString() : (n.id || '')
    }));

    res.json({
      success: true,
      unreadCount,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/notifications/:id/read
// @desc    Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { returnDocument: 'after' }
    );

    if (!notif) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      success: true,
      data: notif,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
      data: {
        unreadCount: 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/notifications
// @desc    Clear all notifications for user
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({ userId });

    res.json({
      success: true,
      message: 'All notifications cleared',
      unreadCount: 0,
      data: {
        notifications: [],
        unreadCount: 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    await Notification.deleteOne({ _id: id, userId });

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      success: true,
      message: 'Notification deleted',
      unreadCount,
      data: {
        unreadCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
