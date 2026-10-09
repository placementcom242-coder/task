const User = require('../models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signupUser = async (req, res) => {
    try {
        const { name, email, mobileNo, password, confirmPassword } = req.body;

        const emailRegx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileNoRegx = /^[0-9]{10}$/;

        if (email && !emailRegx.test(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        if (email) {
            const user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }
        }

        if (mobileNo && !mobileNoRegx.test(mobileNo)) {
            return res.status(400).json({ message: 'Invalid mobile number' });
        }
        if (mobileNo) {
            const user = await User.findOne({ mobileNo });
            if (user) {
                return res.status(400).json({ message: 'User with this mobile number already exists' });
            }
        }

        if (!name || !email || !mobileNo || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Password and Confirm Password do not match' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            mobileNo,
            password: hashedPassword
        });

        res.status(201).json({ message: 'User registered successfully', user });

    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User with this email does not exist' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'supersecretjwtkey_task123',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobileNo: user.mobileNo
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'name email mobileNo createdAt');
        res.status(200).json({ message: 'Users fetched successfully', users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

module.exports = {
    signupUser,
    loginUser,
    getUsers
};
