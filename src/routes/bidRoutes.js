const express = require('express');
const { submitBid, getBidsByGig, hireFreelancer, checkMyBid, getMyBids } = require('../controllers/bidController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, submitBid);
router.get('/my-bids', protect, getMyBids);
router.get('/:gigId', protect, getBidsByGig);
router.get('/my-bid/:gigId', protect, checkMyBid);
router.patch('/:bidId/hire', protect, hireFreelancer);

module.exports = router;
