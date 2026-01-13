const express = require('express');
const { createGig, getGigs, getGigById, getMyGigs } = require('../controllers/gigController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, createGig)
    .get(getGigs);

router.get('/my-gigs', protect, getMyGigs);
router.get('/matches/:otherUserId', protect, require('../controllers/gigController').getGigMatches);
router.route('/:id').get(getGigById);

module.exports = router;
