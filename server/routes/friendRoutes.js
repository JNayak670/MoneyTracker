const express = require('express');
const router = express.Router();
const {
  getAllFriends,
  getFriendLedger,
  createFriend,
  updateFriend,
  deleteFriend
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAllFriends)
  .post(createFriend);

router.route('/:id')
  .get(getFriendLedger)
  .put(updateFriend)
  .delete(deleteFriend);

module.exports = router;
