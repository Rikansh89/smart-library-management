const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadResource } = require('../middleware/upload');

router.get('/', resourceController.getAllResources);
router.get('/categories', resourceController.getCategories);
router.get('/:id', resourceController.getResourceById);
router.post('/', authenticate, authorize('librarian', 'admin'), uploadResource.single('file'), resourceController.uploadResource);
router.delete('/:id', authenticate, authorize('librarian', 'admin'), resourceController.deleteResource);

module.exports = router;
