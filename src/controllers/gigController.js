const Gig = require('../models/Gig');

const createGig = async (req, res) => {
    const { title, description, budget } = req.body;

    try {
        const gig = await Gig.create({
            title,
            description,
            budget,
            ownerId: req.user._id,
        });

        res.status(201).json(gig);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGigs = async (req, res) => {
    const keyword = req.query.search
        ? {
            title: {
                $regex: req.query.search,
                $options: 'i',
            },
        }
        : {};

    try {
        const gigs = await Gig.aggregate([
            { $match: keyword },
            {
                $lookup: {
                    from: 'bids',
                    localField: '_id',
                    foreignField: 'gigId',
                    as: 'bids'
                }
            },
            {
                $addFields: {
                    bidCount: { $size: '$bids' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'ownerId',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            {
                $unwind: '$owner'
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    budget: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    bidCount: 1,
                    ownerId: {
                        _id: '$owner._id',
                        name: '$owner.name',
                        email: '$owner.email'
                    }
                }
            },
            { $sort: { status: -1, createdAt: -1 } }
        ]);

        res.json(gigs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGigById = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id).populate('ownerId', 'name email');
        if (gig) {
            res.json(gig);
        } else {
            res.status(404).json({ message: 'Gig not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyGigs = async (req, res) => {
    try {
        const gigs = await Gig.aggregate([
            { $match: { ownerId: req.user._id } },
            {
                $lookup: {
                    from: 'bids',
                    localField: '_id',
                    foreignField: 'gigId',
                    as: 'bids'
                }
            },
            {
                $addFields: {
                    bidCount: { $size: '$bids' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'ownerId',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            { $unwind: '$owner' },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    budget: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    bidCount: 1,
                    ownerId: {
                        _id: '$owner._id',
                        name: '$owner.name',
                        email: '$owner.email'
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.json(gigs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createGig,
    getGigs,
    getGigById,
    getMyGigs,
};
