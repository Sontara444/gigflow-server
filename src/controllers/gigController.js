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
        const gigs = await Gig.find({ ...keyword, status: 'open' }).populate('ownerId', 'name email');
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

module.exports = {
    createGig,
    getGigs,
    getGigById,
};
