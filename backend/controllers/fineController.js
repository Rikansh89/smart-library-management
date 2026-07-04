const Fine = require('../models/Fine');

exports.getUserFines = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await Fine.findByUser(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getTotalUnpaid = async (req, res, next) => {
  try {
    const total = await Fine.getTotalUnpaid(req.user.id);
    res.json({ total });
  } catch (error) {
    next(error);
  }
};

exports.payFine = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Fine.payFine(id);
    res.json({ message: 'Fine paid successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.getFineStats = async (req, res, next) => {
  try {
    const stats = await Fine.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
