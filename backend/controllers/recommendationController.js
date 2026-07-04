const Recommendation = require('../models/Recommendation');

exports.getRecommendations = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const [categoryRecs, authorRecs, popular] = await Promise.all([
      Recommendation.getByCategory(user_id, 5),
      Recommendation.getByAuthor(user_id, 5),
      Recommendation.getPopular(5)
    ]);

    const combined = [...categoryRecs, ...authorRecs, ...popular];
    const seen = new Set();
    const unique = combined.filter(book => {
      if (seen.has(book.id)) return false;
      seen.add(book.id);
      return true;
    });

    const result = unique.slice(0, 10);
    res.json({ recommendations: result, books: result });
  } catch (error) {
    next(error);
  }
};

exports.logInteraction = async (req, res, next) => {
  try {
    const { book_id, interaction_type } = req.body;
    await Recommendation.logInteraction(req.user.id, book_id, interaction_type);
    res.json({ message: 'Logged.' });
  } catch (error) {
    next(error);
  }
};
