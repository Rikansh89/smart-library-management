const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.post('/', authenticate, [
  body('message').trim().notEmpty().withMessage('Message is required'),
  validate
], chatController.chat);

module.exports = router;
