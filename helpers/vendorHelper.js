const Bottle = require('../models/bottleModel');

// Helper to automatically calculate bottle costs and GST using bottleId
const calculateVendorCosts = async (bottlesInput, gstPercentageInput, userId) => {
    let processedBottles = [];
    let subTotal = 0;

    if (bottlesInput && Array.isArray(bottlesInput) && bottlesInput.length > 0) {
        for (const item of bottlesInput) {
            if (!item.bottleId) {
                throw new Error('bottleId is required for each bottle');
            }

            // Fetch bottle from Bottle model via bottleId
            const bottle = await Bottle.findOne({ _id: item.bottleId, userId });

            if (!bottle) {
                throw new Error(`Bottle with ID '${item.bottleId}' not found in database`);
            }

            const quantity = Number(item.quantity) || 1;
            const price = Number(bottle.price); // Price fetched directly from Bottle model
            const totalAmount = Number((quantity * price).toFixed(2));

            subTotal += totalAmount;

            // Size, Name, and Price are automatically populated from the Bottle model
            processedBottles.push({
                bottleId: bottle._id,
                bottleName: bottle.name,
                bottleSize: bottle.size,  // Size fetched directly from Bottle model
                quantity,
                price: bottle.price,      // Price fetched directly from Bottle model
                totalAmount
            });
        }
    }

    const gstPercentage = gstPercentageInput !== undefined ? Number(gstPercentageInput) : 18;
    const gstAmount = Number(((subTotal * gstPercentage) / 100).toFixed(2));
    const grandTotal = Number((subTotal + gstAmount).toFixed(2));

    return {
        processedBottles,
        gstPercentage,
        subTotal,
        gstAmount,
        grandTotal
    };
};

module.exports = {
    calculateVendorCosts
};
