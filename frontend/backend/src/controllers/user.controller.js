const express = require("express")
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const generateToken = (user) => {
    const payload = { id: user._id, role: user.role };
    const secret = process.env.JWT_SECRET || 'change_this_secret';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
};

const userRegister = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already in use' });

        const user = new User({ name, email, password, role });
        await user.save();

        const token = generateToken(user);
        const userObj = user.toObject();
        delete userObj.password;

        return res.status(201).json({message:"user register succesful" ,user: userObj, token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error',error:err });
    }
};

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(user);
        const userObj = user.toObject();
        delete userObj.password;

        return res.json({message:"user login successful", user: userObj, token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

const logout = async (req, res) => {
    try {
        if (res.clearCookie) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
            });
        }
        return res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

const userProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    userRegister,
    userLogin,
    logout,
    userProfile,
    generateToken,
};