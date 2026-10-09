const Vendor = require('../models/vendorModel');

const getSalesReport = async (req, res) => {
    try {
        const { period, date, month, year } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Base query: only login user's data
        let query = { userId: req.user._id };

        const now = new Date();

        if (period === 'daily') {
            const targetDate = date ? new Date(date) : now;
            const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
            query.createdAt = { $gte: startOfDay, $lte: endOfDay };

        } else if (period === 'monthly') {
            const targetYear = year ? parseInt(year) : now.getFullYear();
            const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
            const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
            const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
            query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

        } else if (period === 'yearly') {
            const targetYear = year ? parseInt(year) : now.getFullYear();
            const startOfYear = new Date(targetYear, 0, 1, 0, 0, 0, 0);
            const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
            query.createdAt = { $gte: startOfYear, $lte: endOfYear };
        }

        // 2. Fetch all matching vendors to calculate totals and date-wise bottle sales
        const allMatchingVendors = await Vendor.find(query).sort({ createdAt: -1 });

        let totalBottlesSold = 0;
        let totalSubTotal = 0;
        let totalGstAmount = 0;
        let totalRevenue = 0;
        const bottleMap = {};
        const dateMap = {};

        for (const vendor of allMatchingVendors) {
            totalSubTotal += vendor.subTotal || 0;
            totalGstAmount += vendor.gstAmount || 0;
            totalRevenue += vendor.grandTotal || 0;

            // Extract YYYY-MM-DD
            const saleDate = vendor.createdAt
                ? vendor.createdAt.toISOString().split('T')[0]
                : 'Unknown';

            if (!dateMap[saleDate]) {
                dateMap[saleDate] = {
                    date: saleDate,
                    totalBottlesSold: 0,
                    totalRevenue: 0,
                    bottles: {}
                };
            }

            dateMap[saleDate].totalRevenue += vendor.grandTotal || 0;

            if (vendor.bottles && Array.isArray(vendor.bottles)) {
                for (const b of vendor.bottles) {
                    const qty = b.quantity || 0;
                    const amount = b.totalAmount || 0;
                    totalBottlesSold += qty;

                    // 1. Overall Bottle breakdown
                    const key = b.bottleSize || b.bottleName || 'Other';
                    if (!bottleMap[key]) {
                        bottleMap[key] = {
                            bottleSize: b.bottleSize,
                            bottleName: b.bottleName,
                            quantitySold: 0,
                            revenue: 0
                        };
                    }
                    bottleMap[key].quantitySold += qty;
                    bottleMap[key].revenue += amount;

                    // 2. Date-wise Bottle breakdown (which date sold which bottle)
                    dateMap[saleDate].totalBottlesSold += qty;
                    if (!dateMap[saleDate].bottles[key]) {
                        dateMap[saleDate].bottles[key] = {
                            bottleSize: b.bottleSize,
                            bottleName: b.bottleName,
                            quantitySold: 0,
                            revenue: 0
                        };
                    }
                    dateMap[saleDate].bottles[key].quantitySold += qty;
                    dateMap[saleDate].bottles[key].revenue += amount;
                }
            }
        }

        // Format dateWiseSales into array sorted by date descending
        const dateWiseSales = Object.values(dateMap).map(d => ({
            date: d.date,
            totalBottlesSold: d.totalBottlesSold,
            totalRevenue: Number(d.totalRevenue.toFixed(2)),
            bottles: Object.values(d.bottles).map(b => ({
                bottleSize: b.bottleSize,
                bottleName: b.bottleName,
                quantitySold: b.quantitySold,
                revenue: Number(b.revenue.toFixed(2))
            }))
        })).sort((a, b) => b.date.localeCompare(a.date));

        // 3. Paginated vendors list
        const totalVendors = allMatchingVendors.length;
        const totalPages = Math.ceil(totalVendors / limit);

        const paginatedVendors = await Vendor.find(query)
            .populate('bottles.bottleId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            message: 'Sales report generated successfully',
            period: period || 'all',
            summary: {
                totalBottlesSold,
                totalSubTotal: Number(totalSubTotal.toFixed(2)),
                totalGstAmount: Number(totalGstAmount.toFixed(2)),
                totalRevenue: Number(totalRevenue.toFixed(2)),
                bottleWiseSales: Object.values(bottleMap).map(b => ({
                    bottleSize: b.bottleSize,
                    bottleName: b.bottleName,
                    quantitySold: b.quantitySold,
                    revenue: Number(b.revenue.toFixed(2))
                })),
                dateWiseSales // Date-wise breakdown: which date sold which bottle
            },
            pagination: {
                totalVendors,
                currentPage: page,
                totalPages,
                limit
            },
            vendors: paginatedVendors
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error generating sales report',
            error: error.message
        });
    }
};

module.exports = {
    getSalesReport
};
