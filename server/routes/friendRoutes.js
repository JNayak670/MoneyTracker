const express = require('express');
const router = express.Router();
const {
  getAllFriends,
  getFriendLedger,
  createFriend,
  updateFriend,
  deleteFriend,
  searchUserByUsername,
  linkUsernameToFriend,
  confirmConnection,
  ignoreConnection,
  shareHistoricalTransactions,
  updateFriendPermission
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/search-user', searchUserByUsername);

router.route('/')
  .get(getAllFriends)
  .post(createFriend);

router.route('/:id')
  .get(getFriendLedger)
  .put(updateFriend)
  .delete(deleteFriend);

router.post('/:id/link-username', linkUsernameToFriend);
router.post('/:id/confirm-connect', confirmConnection);
router.post('/:id/ignore-connect', ignoreConnection);
router.post('/:id/share-history', shareHistoricalTransactions);
router.put('/:id/permission', updateFriendPermission);
router.patch('/:id/permission', updateFriendPermission);

module.exports = router;
