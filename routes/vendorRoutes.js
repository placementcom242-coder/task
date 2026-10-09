const express = require('express');
const {
    addVendor,
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor
} = require('../controllers/vendorController');
const { getSalesReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/add', protect, addVendor);
router.get('/all', protect, getVendors);
router.get('/report', protect, getSalesReport);
router.get('/:id', protect, getVendorById);
router.put('/update/:id', protect, updateVendor);
router.delete('/delete/:id', protect, deleteVendor);

module.exports = router;
