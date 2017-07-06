const mongoose = require('mongoose');

module.exports = mongoose.model('User',{
    id: String,
    name: String,
    email: String,
    password: String,
    admin: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});