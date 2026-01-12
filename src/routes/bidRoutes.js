const express = require('express');
const { submitBid, getBidsByGig, hireFreelancer } = require('../controllers/bidController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, submitBid);
router.get('/:gigId', protect, getBidsByGig);
router.patch('/:bidId/hire', protect, hireFreelancer);

module.exports = router;
