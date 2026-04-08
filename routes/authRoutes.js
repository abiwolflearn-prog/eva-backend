const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res) => {
    const { name, email, password, role, college, program, year, semester } = req.body;
    const sanitizedEmail = email ? email.trim() : '';
    try {
        const userExists = await User.findOne({ email: sanitizedEmail });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ 
            name, 
            email: sanitizedEmail, 
            password, 
            role,
            college,
            program,
            year: Number(year) || 1,
            semester: Number(semester) || 1
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            college: user.college,
            program: user.program,
            year: user.year,
            semester: user.semester,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const sanitizedEmail = email ? email.trim() : '';
    try {
        const user = await User.findOne({ email: sanitizedEmail });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                program: user.program,
                year: user.year,
                semester: user.semester,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
