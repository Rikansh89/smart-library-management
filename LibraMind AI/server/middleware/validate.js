const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return res.status(400).json({ error: 'Validation failed', details: formattedErrors });
  }
  next();
}

module.exports = { validate };
