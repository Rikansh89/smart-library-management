const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./loggerService');

let genAI = null;
let model = null;

function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    logger.warn('Gemini API key not configured. AI features will use mock data.');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    logger.info('Gemini AI initialized successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to initialize Gemini AI: ${error.message}`);
    return false;
  }
}

async function getRecommendations(userId, readingHistory, allBooks) {
  if (!model) {
    return getMockRecommendations(readingHistory, allBooks);
  }

  try {
    const readTitles = readingHistory.map(h => h.title).join(', ');
    const prompt = `Based on a user who has read these books: ${readTitles || 'no reading history yet'}. 
    Recommend 5 books from this list that they would enjoy: ${allBooks.map(b => b.title).join(', ')}.
    Return only the book titles as a comma-separated list, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const recommendedTitles = text.split(',').map(t => t.trim());
    return allBooks.filter(b => recommendedTitles.includes(b.title));
  } catch (error) {
    logger.error(`Gemini recommendation error: ${error.message}`);
    return getMockRecommendations(readingHistory, allBooks);
  }
}

async function getSimilarBooks(book, allBooks) {
  if (!model) {
    return getMockSimilarBooks(book, allBooks);
  }

  try {
    const prompt = `Find 5 books similar to "${book.title}" by ${book.author} (genre: ${book.genre || 'unknown'}, category: ${book.category || 'unknown'}).
    From this list: ${allBooks.map(b => b.title).join(', ')}.
    Return only book titles as a comma-separated list, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const similarTitles = text.split(',').map(t => t.trim());
    return allBooks.filter(b => similarTitles.includes(b.title));
  } catch (error) {
    logger.error(`Gemini similar books error: ${error.message}`);
    return getMockSimilarBooks(book, allBooks);
  }
}

async function chatQuery(message, context) {
  if (!model) {
    return getMockChatResponse(message);
  }

  try {
    const prompt = `You are a helpful library assistant for LibraMind AI - Smart Library Management System.
    Answer the following question about library services, books, or the system:
    Context: ${JSON.stringify(context)}
    User: ${message}
    Assistant: Provide a helpful, concise response.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error(`Gemini chat error: ${error.message}`);
    return getMockChatResponse(message);
  }
}

async function analyzeReadingHabits(readingHistory) {
  if (!model) {
    return getMockReadingAnalysis(readingHistory);
  }

  try {
    const historySummary = readingHistory.map(h =>
      `${h.title} by ${h.author} (genre: ${h.genre}, rating: ${h.rating || 'N/A'})`
    ).join('\n');

    const prompt = `Analyze these reading habits and provide insights:\n${historySummary}\n
    Return a JSON with fields: favorite_genre, total_books_read, average_rating, reading_pace, recommendations`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
      return JSON.parse(response.text());
    } catch {
      return getMockReadingAnalysis(readingHistory);
    }
  } catch (error) {
    logger.error(`Gemini analysis error: ${error.message}`);
    return getMockReadingAnalysis(readingHistory);
  }
}

function getMockRecommendations(readingHistory, allBooks) {
  const readIds = new Set(readingHistory.map(h => h.book_id));
  const unread = allBooks.filter(b => !readIds.has(b.id));
  return unread.sort(() => Math.random() - 0.5).slice(0, 5);
}

function getMockSimilarBooks(book, allBooks) {
  return allBooks
    .filter(b => b.id !== book.id)
    .filter(b => b.genre === book.genre || b.author === book.author)
    .slice(0, 5);
}

function getMockChatResponse(message) {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('return') || lowerMsg.includes('return book')) {
    return 'To return a book, visit the library counter with the book or use the self-return kiosk. Your librarian can also process returns.';
  }
  if (lowerMsg.includes('fine') || lowerMsg.includes('late')) {
    return 'Late return fines are calculated at $0.50 per day per book. You can check your current fines on your dashboard.';
  }
  if (lowerMsg.includes('borrow') || lowerMsg.includes('issue')) {
    return 'You can borrow books by visiting the library with your student ID. Use the search feature to find available books first.';
  }
  if (lowerMsg.includes('hour') || lowerMsg.includes('open') || lowerMsg.includes('timing')) {
    return 'The library is open Monday-Friday: 8:00 AM - 8:00 PM, Saturday: 9:00 AM - 5:00 PM, Sunday: Closed.';
  }
  if (lowerMsg.includes('reserve') || lowerMsg.includes('hold')) {
    return 'You can reserve books that are currently issued to others. Once available, you will be notified via email.';
  }
  return 'I am your LibraMind AI assistant. I can help you with book searches, library policies, due dates, fines, and more. How can I assist you today?';
}

function getMockReadingAnalysis(readingHistory) {
  const genres = readingHistory.map(h => h.genre).filter(Boolean);
  const genreCounts = {};
  genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
  const favoriteGenre = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a])[0] || 'Unknown';

  return {
    favorite_genre: favoriteGenre,
    total_books_read: readingHistory.length,
    average_rating: readingHistory.reduce((sum, h) => sum + (h.rating || 0), 0) / (readingHistory.filter(h => h.rating).length || 1),
    reading_pace: readingHistory.length > 5 ? 'Avid Reader' : 'Casual Reader',
    recommendations: ['Keep exploring different genres', 'Try setting a monthly reading goal']
  };
}

module.exports = { initializeGemini, getRecommendations, getSimilarBooks, chatQuery, analyzeReadingHabits };
