const Message = require('../models/Message');
const User = require('../models/User');

const sendMessage = async (req, res) => {
    const { recipientId, content } = req.body;
    const senderId = req.user._id;

    try {
        const message = await Message.create({
            sender: senderId,
            recipient: recipientId,
            content,
        });

        const fullMessage = await Message.findById(message._id)
            .populate('sender', 'name email')
            .populate('recipient', 'name email');

        const io = req.app.get('io');
        io.to(recipientId).emit('receive_message', fullMessage);

        res.status(201).json(fullMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMessages = async (req, res) => {
    const { userId } = req.params;
    const myId = req.user._id;

    try {
        const messages = await Message.find({
            $or: [
                { sender: myId, recipient: userId },
                { sender: userId, recipient: myId },
            ],
        })
            .populate('sender', 'name email')
            .populate('recipient', 'name email')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getConversations = async (req, res) => {
    const userId = req.user._id;

    try {
        // Find all messages where the user is either sender or recipient
        const messages = await Message.find({
            $or: [{ sender: userId }, { recipient: userId }]
        })
            .populate('sender', 'name email')
            .populate('recipient', 'name email')
            .sort({ createdAt: -1 });

        const conversations = [];
        const seenUsers = new Set();

        messages.forEach(msg => {
            const otherUser = msg.sender._id.toString() === userId.toString()
                ? msg.recipient
                : msg.sender;

            if (!seenUsers.has(otherUser._id.toString())) {
                conversations.push({
                    user: otherUser,
                    lastMessage: msg.content,
                    timestamp: msg.createdAt,
                    unread: !msg.read && msg.recipient._id.toString() === userId.toString()
                });
                seenUsers.add(otherUser._id.toString());
            }
        });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const markMessagesRead = async (req, res) => {
    const senderId = req.params.senderId; // The user who sent the messages (the other person)
    const recipientId = req.user._id; // Me, who is reading them

    try {
        await Message.updateMany(
            { sender: senderId, recipient: recipientId, read: false },
            { $set: { read: true } }
        );

        // Notify the sender that I have read their messages
        const io = req.app.get('io');
        io.to(senderId).emit('messages_read', {
            readerId: recipientId,
            readerName: req.user.name
        });

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    getConversations,
    markMessagesRead
};
