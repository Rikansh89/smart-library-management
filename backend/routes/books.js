const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadCover } = require('../middleware/upload');

router.get('/', bookController.getAllBooks);
router.get('/categories', bookController.getCategories);
router.get('/most-borrowed', bookController.getMostBorrowed);
router.get('/:id', bookController.getBookById);
router.post('/', authenticate, authorize('librarian', 'admin'), uploadCover.single('cover_image'), bookController.createBook);
router.put('/:id', authenticate, authorize('librarian', 'admin'), uploadCover.single('cover_image'), bookController.updateBook);
router.delete('/:id', authenticate, authorize('librarian', 'admin'), bookController.deleteBook);

module.exports = router;
