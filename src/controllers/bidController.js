const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Gig = require('../models/Gig');

const submitBid = async (req, res) => {
    const { gigId, message, price } = req.body;

    try {
        const gig = await Gig.findById(gigId);

        if (!gig) {
            return res.status(404).json({ message: 'Gig not found' });
        }

        if (gig.status !== 'open') {
            return res.status(400).json({ message: 'Gig is not open for bidding' });
        }

        // prevent owner from bidding on their own gig
        if (gig.ownerId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Owner cannot bid on their own gig' });
        }

        const existingBid = await Bid.findOne({ gigId, freelancerId: req.user._id });
        if (existingBid) {
            return res.status(400).json({ message: 'You have already placed a bid on this gig' });
        }

        const bid = await Bid.create({
            gigId,
            freelancerId: req.user._id,
            message,
            price,
        });

        res.status(201).json(bid);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBidsByGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.gigId);

        if (!gig) {
            return res.status(404).json({ message: 'Gig not found' });
        }

        if (gig.ownerId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to view bids' });
        }

        const bids = await Bid.find({ gigId: req.params.gigId }).populate('freelancerId', 'name email');
        res.json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const hireFreelancer = async (req, res) => {
    const { bidId } = req.params;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. Fetch Bid and Gig within session to ensure consistency
        const bid = await Bid.findById(bidId).populate('gigId').session(session);

        if (!bid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Bid not found' });
        }

        const gig = await Gig.findById(bid.gigId._id).session(session);

        if (gig.ownerId.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ message: 'Not authorized to hire for this gig' });
        }

        // 2. Transactonal Integrity Check: Ensure gig is still open
        if (gig.status !== 'open') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Gig is already assigned' });
        }

        // 3. Mark this bid as hired
        bid.status = 'hired';
        await bid.save({ session });

        // 4. Mark all other bids for this gig as rejected
        await Bid.updateMany(
            { gigId: gig._id, _id: { $ne: bidId } },
            { status: 'rejected' },
            { session }
        );

        // 5. Update gig status to assigned
        gig.status = 'assigned';
        await gig.save({ session });

        await session.commitTransaction();
        session.endSession();

        // 6. Real-time Notification
        const io = req.app.get('io');
        // Notify the freelancer privately
        io.to(bid.freelancerId.toString()).emit('hire_notification', {
            message: `You have been hired for ${gig.title}!`,
            gigId: gig._id,
        });

        res.json({ message: 'Freelancer hired successfully', bid });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitBid,
    getBidsByGig,
    hireFreelancer,
};
