const express = require('express');
const {
    addBottle,
    getBottles,
    getBottleById,
    updateBottle,
    deleteBottle
} = require('../controllers/bottleController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/add', protect, addBottle);
router.get('/all', protect, getBottles);
router.get('/:id', protect, getBottleById);
router.put('/update/:id', protect, updateBottle);
router.delete('/delete/:id', protect, deleteBottle);

module.exports = router;
