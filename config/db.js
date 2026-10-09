const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Database connection failed: ${error.message}`);
    }
};

module.exports = connectDB;
