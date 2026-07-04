const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../config/nodemailer');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await User.create({ name, email, password: hashedPassword, role: role || 'student' });
    const user = await User.findById(userId);

    res.status(201).json({
      message: 'Registration successful.',
      token: generateToken(user),
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password: _, ...userData } = user;

    res.json({
      message: 'Login successful.',
      token,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(user.email, hashedPassword);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const fields = {};
    if (name) fields.name = name;
    if (phone) fields.phone = phone;
    if (address) fields.address = address;

    await User.update(req.user.id, fields);
    const user = await User.findById(req.user.id);
    res.json({ message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'No account with that email.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 12);
    const resetExpires = new Date(Date.now() + 3600000);

    await User.update(user.id, {
      reset_token: resetTokenHash,
      reset_expires: resetExpires
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset - Smart Library',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${resetUrl}" style="padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'Password reset email sent.' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const [users] = await require('../config/db').query(
      'SELECT * FROM users WHERE reset_expires > NOW()'
    );

    let matchedUser = null;
    for (const u of users) {
      const isMatch = await bcrypt.compare(token, u.reset_token);
      if (isMatch) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.updatePassword(matchedUser.email, hashedPassword);
    await User.update(matchedUser.id, { reset_token: null, reset_expires: null });

    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    next(error);
  }
};
