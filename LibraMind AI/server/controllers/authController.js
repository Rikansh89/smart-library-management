const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const logger = require('../services/loggerService');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, student_id, phone, address } = req.body;

    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const allowedRoles = ['student', 'librarian'];
    const userRole = allowedRoles.includes(role) ? role : 'student';

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = db.prepare(`
      INSERT INTO users (name, email, password, role, department, student_id, phone, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, hashedPassword, userRole, department || null, student_id || null, phone || null, address || null);

    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);

    logger.info(`New user registered: ${email} (${userRole})`);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_pic: user.profile_pic,
        department: user.department,
        student_id: user.student_id,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const db = getDatabase();

    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = uuidv4();
    const expiry = new Date(Date.now() + 3600000).toISOString();

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?')
      .run(resetToken, expiry, user.id);

    logger.info(`Password reset token generated for: ${email}`);

    res.json({ message: 'Password reset link sent to email', resetToken });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const db = getDatabase();

    const user = db.prepare(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > datetime("now")'
    ).get(token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?')
      .run(hashedPassword, user.id);

    logger.info(`Password reset successful for user ID: ${user.id}`);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = (req, res, next) => {
  try {
    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, name, email, role, profile_pic, department, student_id, phone, address, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, department } = req.body;
    const db = getDatabase();

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (phone) { updates.push('phone = ?'); params.push(phone); }
    if (address) { updates.push('address = ?'); params.push(address); }
    if (department) { updates.push('department = ?'); params.push(department); }

    if (req.file) {
      updates.push('profile_pic = ?');
      params.push(`/uploads/covers/${req.file.filename}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = datetime("now")');
    params.push(req.user.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const user = db.prepare(
      'SELECT id, name, email, role, profile_pic, department, student_id, phone, address FROM users WHERE id = ?'
    ).get(req.user.id);

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDatabase();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?')
      .run(hashedPassword, req.user.id);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
