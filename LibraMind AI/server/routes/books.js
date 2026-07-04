const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const bookController = require('../controllers/bookController');

const router = express.Router();

router.get('/', authenticate, bookController.getBooks);
router.get('/genres', authenticate, bookController.getGenres);
router.get('/categories', authenticate, bookController.getCategories);
router.get('/:id', authenticate, bookController.getBookById);
router.get('/:id/similar', authenticate, bookController.getSimilarBooks);

router.post('/', authenticate, authorize('librarian', 'admin'), upload.single('cover_image'), [
  body('isbn').notEmpty().withMessage('ISBN is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  validate
], bookController.addBook);

router.put('/:id', authenticate, authorize('librarian', 'admin'), upload.single('cover_image'), bookController.editBook);

router.delete('/:id', authenticate, authorize('admin'), bookController.deleteBook);

module.exports = router;
