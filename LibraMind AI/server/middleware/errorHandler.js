const logger = require('../services/loggerService');

function errorHandler(err, req, res, next) {
  logger.error(`${err.message} | ${req.method} ${req.originalUrl} | ${req.ip}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';
  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
