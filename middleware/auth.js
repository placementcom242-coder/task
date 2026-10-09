const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_task123');

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User no longer exists'
                });
            }

            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
                error: error.message
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No authorization token provided.'
        });
    }
};

module.exports = { protect };
