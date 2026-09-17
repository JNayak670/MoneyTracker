const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public admin login route
router.post('/login', adminController.adminLogin);

// Protected admin endpoints
router.use(adminController.requireAdminAuth);
router.get('/profile', adminController.getAdminProfile);
router.put('/change-password', adminController.changeAdminPassword);
router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAdminUsers);
router.put('/users/:id/unlock', adminController.unlockAdminUser);
router.put('/users/:id/reset-pin', adminController.resetAdminUserPin);
router.put('/users/:id/username', adminController.setAdminUserUsername);
router.delete('/users/:id', adminController.deleteAdminUser);
router.get('/transactions', adminController.getAdminTransactions);
router.put('/transactions/:id/approve', adminController.approveAdminTransaction);
router.put('/transactions/:id/reject', adminController.rejectAdminTransaction);
router.get('/connections', adminController.getAdminConnections);
router.put('/connections/:id/permission', adminController.updateAdminConnectionPermission);
router.get('/shares', adminController.getAdminShares);
router.delete('/shares/:id', adminController.deleteAdminShare);

module.exports = router;


