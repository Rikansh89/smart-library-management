const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const libraryContext = 'You are a helpful library assistant for Smart Library Management System. You can help users find books, answer questions about library policies, suggest books based on topics, and guide users on how to use the library system. Keep responses concise and helpful. Borrowing period is 14 days, fine is $5 per day overdue.';

    const result = await model.generateContent(libraryContext + '\n\nUser: ' + message + '\nAssistant:');
    const response = result.response.text();

    res.json({ reply: response });
  } catch (error) {
    next(error);
  }
};

exports.searchBooks = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const books = await Book.findAll({ search: query, limit: 5 });
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const bookList = books.books.map(b => '- ' + b.title + ' by ' + b.author + ' (' + b.category + ')').join('\n');

    const prompt = 'Based on this query: "' + query + '", recommend from these available books:\n' + bookList + '\nProvide a helpful recommendation.';

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ reply: response, books: books.books });
  } catch (error) {
    next(error);
  }
};
