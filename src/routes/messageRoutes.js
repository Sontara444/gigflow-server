const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, getMessages, getConversations } = require('../controllers/messageController');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/:userId', protect, getMessages);
router.get('/', protect, getConversations);

module.exports = router;
