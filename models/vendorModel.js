const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        mobileNo: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        gstNumber: {
            type: String,
            required: true,
            trim: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        bottles: [
            {
                bottleId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Bottle',
                    required: true
                },
                bottleName: {
                    type: String
                },
                bottleSize: {
                    type: String
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                price: {
                    type: Number,
                    required: true
                },
                totalAmount: {
                    type: Number,
                    required: true
                }
            }
        ],
        gstPercentage: {
            type: Number,
            default: 18
        },
        subTotal: {
            type: Number,
            default: 0
        },
        gstAmount: {
            type: Number,
            default: 0
        },
        grandTotal: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const vendorModel = mongoose.model('Vendor', vendorSchema);
module.exports = vendorModel
