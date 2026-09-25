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
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/settle', settleUp);
router.get('/group/:splitGroupId', getGroupSplitDetails);
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
