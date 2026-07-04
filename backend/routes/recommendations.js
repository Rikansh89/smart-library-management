const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, recommendationController.getRecommendations);
router.post('/log', authenticate, recommendationController.logInteraction);

module.exports = router;
