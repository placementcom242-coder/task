const Bottle = require('../models/bottleModel');

const addBottle = async (req, res) => {
    try {
        const { name, size, price } = req.body;

        if (!name || !size || price === undefined) {
            return res.status(400).json({ message: 'All fields are required: name, size, price' });
        }

        const existingBottle = await Bottle.findOne({
            userId: req.user._id,
            size: size.toUpperCase()
        });

        if (existingBottle) {
            return res.status(400).json({ message: 'Bottle with this size already exists' });
        }

        const bottle = await Bottle.create({
            name,
            size: size.toUpperCase(),
            price: Number(price),
            userId: req.user._id
        });

        res.status(201).json({ message: 'Bottle added successfully', bottle });

    } catch (error) {
        res.status(500).json({ message: 'Error adding bottle', error });
    }
};

const getBottles = async (req, res) => {
    try {
        const bottles = await Bottle.find({ userId: req.user._id });
        res.status(200).json({ message: 'Bottles fetched successfully', bottles });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bottles', error });
    }
};

const getBottleById = async (req, res) => {
    try {
        const bottle = await Bottle.findById(req.params.id);

        if (!bottle) {
            return res.status(404).json({ message: 'Bottle not found' });
        }

        if (bottle.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You cannot access other user's bottle" });
        }

        res.status(200).json({ message: 'Bottle fetched successfully', bottle });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bottle', error });
    }
};

const updateBottle = async (req, res) => {
    try {
        const bottle = await Bottle.findById(req.params.id);

        if (!bottle) {
            return res.status(404).json({ message: 'Bottle not found' });
        }

        if (bottle.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You cannot update other user's bottle" });
        }

        const { name, size, price } = req.body;

        const updatedBottle = await Bottle.findByIdAndUpdate(
            req.params.id,
            {
                name: name || bottle.name,
                size: size ? size.toUpperCase() : bottle.size,
                price: price !== undefined ? Number(price) : bottle.price
            },
            { new: true }
        );

        res.status(200).json({ message: 'Bottle updated successfully', bottle: updatedBottle });
    } catch (error) {
        res.status(500).json({ message: 'Error updating bottle', error });
    }
};

const deleteBottle = async (req, res) => {
    try {
        const bottle = await Bottle.findById(req.params.id);

        if (!bottle) {
            return res.status(404).json({ message: 'Bottle not found' });
        }

        if (bottle.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You cannot delete other user's bottle" });
        }

        await Bottle.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Bottle deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting bottle', error });
    }
};

module.exports = {
    addBottle,
    getBottles,
    getBottleById,
    updateBottle,
    deleteBottle
};
