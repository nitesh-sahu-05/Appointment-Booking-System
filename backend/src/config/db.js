
const mongoose = require('mongoose');
const dns = require('dns')

dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
])
const connectDB = async () => {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    }).catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });
}


module.exports = connectDB;