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

    try {
        const bid = await Bid.findById(bidId).populate('gigId');

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const gig = await Gig.findById(bid.gigId._id);

        if (gig.ownerId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to hire for this gig' });
        }

        if (gig.status !== 'open') {
            return res.status(400).json({ message: 'Gig is already assigned' });
        }

        // 1. Mark this bid as hired
        bid.status = 'hired';
        await bid.save();

        // 2. Mark all other bids for this gig as rejected
        await Bid.updateMany(
            { gigId: gig._id, _id: { $ne: bidId } },
            { status: 'rejected' }
        );

        // 3. Update gig status to assigned
        gig.status = 'assigned';
        await gig.save();

        res.json({ message: 'Freelancer hired successfully', bid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitBid,
    getBidsByGig,
    hireFreelancer,
};
