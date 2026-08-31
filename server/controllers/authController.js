const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
}

// @route   POST /api/auth/register
// @desc    Register a new user with PIN
exports.register = async (req, res) => {
  try {
    const { name, email, pin, password, currency = '₹' } = req.body;
    const rawPin = (pin || password || '').toString().trim();

    if (!name || !email || !rawPin) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and a 4-6 digit security PIN.'
      });
    }

    if (!/^\d{4,6}$/.test(rawPin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be 4 to 6 numeric digits.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(rawPin, salt);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      pin: hashedPin,
      currency
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currency: user.currency
        },
        token
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user with PIN & get token
exports.login = async (req, res) => {
  try {
    const { email, pin, password } = req.body;
    const rawPin = (pin || password || '').toString().trim();

    if (!email || !rawPin) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and your security PIN.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or PIN.'
      });
    }

    const storedHash = user.pin || user.password;
    const isMatch = await bcrypt.compare(rawPin, storedHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or PIN.'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currency: user.currency
        },
        token
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user profile
exports.getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route   PUT /api/auth/settings
// @desc    Update user profile & currency
exports.updateSettings = async (req, res) => {
  try {
    const { name, currency } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (currency) user.currency = currency;
    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
