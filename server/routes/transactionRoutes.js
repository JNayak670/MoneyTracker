const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  settleUp,
  approveTransaction,
  rejectTransaction,
  getGroupSplitDetails,
  deleteGroupSplit
} = require('../controllers/transactionController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Group split details can be accessed by authenticated users and unauthenticated shared ledger viewers
router.get('/group/:splitGroupId', optionalProtect, getGroupSplitDetails);

router.use(protect);

router.post('/settle', settleUp);
router.delete('/group/:splitGroupId', deleteGroupSplit);
router.post('/:id/approve', approveTransaction);
router.post('/:id/reject', rejectTransaction);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
