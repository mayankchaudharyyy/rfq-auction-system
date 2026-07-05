const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// POST /api/auth/register
async function register(req, res) {
    try {
        const { name, email, password, company_name, role } = req.body;

        if (!name || !email || !password || !company_name || !role) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        if (!['buyer', 'supplier'].includes(role)) {
            return res.status(400).json({ error: 'Role must be buyer or supplier.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const user = await User.create({ name, email, password, company_name, role });
        const token = signToken(user._id);

        return res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                company_name: user.company_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('register error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join('. ') });
        }
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

// POST /api/auth/login
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = signToken(user._id);

        return res.json({
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                company_name: user.company_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('login error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

// GET /api/auth/me
async function getMe(req, res) {
    return res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            company_name: req.user.company_name,
            role: req.user.role
        }
    });
}

module.exports = { register, login, getMe };
