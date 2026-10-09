const Vendor = require('../models/vendorModel');
const Bottle = require('../models/bottleModel');
const { calculateVendorCosts } = require('../helpers/vendorHelper');

const addVendor = async (req, res) => {
    try {
        const { name, email, gstNumber, mobileNo, address, bottles, gstPercentage } = req.body;

        const emailRegx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileNoRegx = /^[0-9]{10}$/;

        if (!name || !email || !mobileNo || !address || !gstNumber) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (email && !emailRegx.test(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        if (mobileNo && !mobileNoRegx.test(mobileNo)) {
            return res.status(400).json({ message: 'Invalid mobile number' });
        }

        const existingVendor = await Vendor.findOne({
            userId: req.user._id,
            $or: [{ email }, { gstNumber }]
        });

        if (existingVendor) {
            return res.status(400).json({ message: 'Vendor with this email or GST number already exists' });
        }

        // Check if bottleId is valid and exists in database
        if (bottles && Array.isArray(bottles) && bottles.length > 0) {
            for (const item of bottles) {
                if (!item.bottleId) {
                    return res.status(400).json({ message: 'bottleId is required for each bottle' });
                }

                const bottle = await Bottle.findOne({ _id: item.bottleId, userId: req.user._id });

                if (!bottle) {
                    return res.status(400).json({
                        message: `Bottle with ID '${item.bottleId}' does not exist in database`
                    });
                }
            }
        }

        // Calculate bottle costs and GST automatically via helper (fetches size and price using bottleId)
        const calculation = await calculateVendorCosts(bottles, gstPercentage, req.user._id);

        const vendor = await Vendor.create({
            name,
            email,
            mobileNo,
            address,
            gstNumber,
            userId: req.user._id,
            bottles: calculation.processedBottles,
            gstPercentage: calculation.gstPercentage,
            subTotal: calculation.subTotal,
            gstAmount: calculation.gstAmount,
            grandTotal: calculation.grandTotal
        });

        res.status(201).json({ message: 'Vendor added successfully', vendor });

    } catch (error) {
        res.status(500).json({ message: 'Error adding vendor', error: error.message });
    }
};

const getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find({ userId: req.user._id }).populate('bottles.bottleId');
        res.status(200).json({ message: 'Vendors fetched successfully', vendors });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vendors', error: error.message });
    }
};

const getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id).populate('bottles.bottleId');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        if (vendor.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You cannot access other user's vendor" });
        }

        res.status(200).json({ message: 'Vendor fetched successfully', vendor });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vendor', error: error.message });
    }
};

const updateVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        if (vendor.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You cannot update other user's vendor" });
        }

        const { name, email, gstNumber, mobileNo, address, bottles, gstPercentage } = req.body;

        // Check if bottleId is valid and exists in database for update
        if (bottles && Array.isArray(bottles) && bottles.length > 0) {
            for (const item of bottles) {
                if (!item.bottleId) {
                    return res.status(400).json({ message: 'bottleId is required for each bottle' });
                }

                const bottle = await Bottle.findOne({ _id: item.bottleId, userId: req.user._id });

                if (!bottle) {
                    return res.status(400).json({
                        message: `Bottle with ID '${item.bottleId}' does not exist in database`
                    });
                }
            }
        }

        let updateData = {
            name: name || vendor.name,
            email: email || vendor.email,
            mobileNo: mobileNo || vendor.mobileNo,
            address: address || vendor.address,
            gstNumber: gstNumber || vendor.gstNumber
        };

        // If bottles or GST percentage updated, recalculate costs automatically via helper
        if (bottles !== undefined || gstPercentage !== undefined) {
            const calculation = await calculateVendorCosts(
                bottles !== undefined ? bottles : vendor.bottles,
                gstPercentage !== undefined ? gstPercentage : vendor.gstPercentage,
                req.user._id
            );
            updateData.bottles = calculation.processedBottles;
            updateData.gstPercentage = calculation.gstPercentage;
            updateData.subTotal = calculation.subTotal;
            updateData.gstAmount = calculation.gstAmount;
            updateData.grandTotal = calculation.grandTotal;
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('bottles.bottleId');

        res.status(200).json({ message: 'Vendor updated successfully', vendor: updatedVendor });
    } catch (error) {
        res.status(500).json({ message: 'Error updating vendor', error: error.message });
    }
};

const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        if (vendor.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You cannot delete other user's vendor" });
        }

        await Vendor.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting vendor', error: error.message });
    }
};

module.exports = {
    addVendor,
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor
};
