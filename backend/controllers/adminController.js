const User = require('../models/User');
const Book = require('../models/Book');
const bcrypt = require('bcryptjs');

exports.getDashboard = async (req, res, next) => {
  try {
    const [[{ totalBooks }]] = await require('../config/db').query('SELECT COUNT(*) as totalBooks FROM books');
    const [[{ totalUsers }]] = await require('../config/db').query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalStudents }]] = await require('../config/db').query("SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'");
    const [[{ totalLibrarians }]] = await require('../config/db').query("SELECT COUNT(*) as totalLibrarians FROM users WHERE role = 'librarian'");
    const [[{ activeLoans }]] = await require('../config/db').query("SELECT COUNT(*) as activeLoans FROM issued_books WHERE status = 'issued'");
    const [[{ pendingRequests }]] = await require('../config/db').query("SELECT COUNT(*) as pendingRequests FROM issued_books WHERE status = 'pending'");
    const [[{ totalFines }]] = await require('../config/db').query("SELECT COALESCE(SUM(amount), 0) as totalFines FROM fines WHERE status = 'unpaid'");
    const [[{ collectedFines }]] = await require('../config/db').query("SELECT COALESCE(SUM(amount), 0) as collectedFines FROM fines WHERE status = 'paid'");
    const [[{ todayReturns }]] = await require('../config/db').query("SELECT COUNT(*) as todayReturns FROM issued_books WHERE status = 'returned' AND DATE(return_date) = CURDATE()");
    const [[{ todayIssues }]] = await require('../config/db').query("SELECT COUNT(*) as todayIssues FROM issued_books WHERE DATE(issue_date) = CURDATE()");

    res.json({
      totalBooks, totalUsers, totalStudents, totalLibrarians,
      activeLoans, pendingRequests, totalFines, collectedFines,
      todayReturns, todayIssues
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, page, limit } = req.query;
    const result = await User.findAll(role || null, parseInt(page) || 1, parseInt(limit) || 10);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await User.create({ name, email, password: hashedPassword, role });
    const user = await User.findById(userId);
    res.status(201).json({ message: 'User created.', user });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const fields = {};
    if (name) fields.name = name;
    if (email) fields.email = email;
    if (role) fields.role = role;
    await User.update(id, fields);
    res.json({ message: 'User updated.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await User.delete(id);
    res.json({ message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.getSystemLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await require('../config/db').query('SELECT COUNT(*) as total FROM system_logs');
    const [logs] = await require('../config/db').query(
      `SELECT l.*, u.name as user_name FROM system_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [String(limit), String(offset)]
    );
    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};
