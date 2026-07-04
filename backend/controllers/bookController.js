const Book = require('../models/Book');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

exports.createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, publication_year, quantity, description } = req.body;

    if (!title || !author || !isbn) {
      return res.status(400).json({ message: 'Title, author, and ISBN are required.' });
    }

    const existing = await Book.findByISBN(isbn);
    if (existing) {
      return res.status(409).json({ message: 'Book with this ISBN already exists.' });
    }

    const cover_image = req.file ? `/uploads/covers/${req.file.filename}` : null;

    const bookId = await Book.create({
      title, author, isbn, category, publication_year,
      quantity: quantity || 1, description, cover_image
    });

    const qrDir = path.join(__dirname, '..', 'uploads', 'covers');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    const qrPath = path.join(qrDir, `qr_${bookId}.png`);
    await QRCode.toFile(qrPath, `${process.env.CLIENT_URL}/books/${bookId}`);

    await Book.update(bookId, { qr_code: `/uploads/covers/qr_${bookId}.png` });

    const book = await Book.findById(bookId);
    res.status(201).json({ message: 'Book added successfully.', book });
  } catch (error) {
    next(error);
  }
};

exports.getAllBooks = async (req, res, next) => {
  try {
    const { page, limit, search, category, sort } = req.query;
    const result = await Book.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      search, category, sort
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    res.json(book);
  } catch (error) {
    next(error);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const { title, author, isbn, category, publication_year, quantity, description } = req.body;
    const fields = {};
    if (title) fields.title = title;
    if (author) fields.author = author;
    if (isbn) fields.isbn = isbn;
    if (category) fields.category = category;
    if (publication_year) fields.publication_year = publication_year;
    if (quantity) {
      const diff = quantity - book.quantity;
      fields.quantity = quantity;
      fields.available_quantity = book.available_quantity + diff;
    }
    if (description) fields.description = description;
    if (req.file) fields.cover_image = `/uploads/covers/${req.file.filename}`;

    await Book.update(req.params.id, fields);
    const updated = await Book.findById(req.params.id);
    res.json({ message: 'Book updated successfully.', book: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    await Book.delete(req.params.id);
    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Book.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.getMostBorrowed = async (req, res, next) => {
  try {
    const books = await Book.getMostBorrowed(parseInt(req.query.limit) || 10);
    res.json(books);
  } catch (error) {
    next(error);
  }
};
