require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { initDatabase, closeDatabase } = require('./config/database');
const { initializeDatabase } = require('./models/schema');
const errorHandler = require('./middleware/errorHandler');
const { initializeGemini } = require('./services/geminiService');
const logger = require('./services/loggerService');
const { calculateAndUpdateFines } = require('./services/fineService');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const issueReturnRoutes = require('./routes/issueReturn');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function start() {
  try {
    await initDatabase();
    initializeDatabase();
    initializeGemini();

    app.use('/api/auth', authRoutes);
    app.use('/api/books', bookRoutes);
    app.use('/api/issues', issueReturnRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/chat', chatRoutes);

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
    });

    setInterval(() => {
      try {
        calculateAndUpdateFines();
      } catch (error) {
        logger.error(`Scheduled fine calculation error: ${error.message}`);
      }
    }, 3600000);

    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`LibraMind AI Server running on port ${PORT}`);
      console.log(`LibraMind AI Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

process.on('SIGINT', () => {
  logger.info('Server shutting down...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason.message || reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  closeDatabase();
  process.exit(1);
});

module.exports = app;
