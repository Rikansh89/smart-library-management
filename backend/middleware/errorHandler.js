const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} -`, err.message);
  console.error(`[ERROR] Stack:`, err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Duplicate entry found.' });
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    console.error('[ERROR] CRITICAL: Database table missing. Ensure schema.sql has been imported.');
    return res.status(503).json({ message: 'Database not initialized. Please contact administrator.' });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('[ERROR] CRITICAL: Database connection lost.');
    return res.status(503).json({ message: 'Database temporarily unavailable. Please try again.' });
  }

  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
    console.error('[ERROR] CRITICAL: Database connection timeout/reset.');
    return res.status(503).json({ message: 'Database connection timeout. Please try again.' });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  if (err.name === 'JsonWebTokenError') {
    console.error('[ERROR] JWT error:', err.message);
    return res.status(401).json({ message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error.'
  });
};

module.exports = errorHandler;
