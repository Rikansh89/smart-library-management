const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log('Starting Smart Library Backend...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const errorHandler = require('./middleware/errorHandler');
const { initializeDatabase } = require('./config/db');

const app = express();

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Smart Library Backend is alive'
  });
});

const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : ['http://localhost:5173'];
console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/study-rooms', require('./routes/studyRooms'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/fines', require('./routes/fines'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/chatbot', require('./routes/chatbot'));

const pool = require('./config/db');

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: error.message, timestamp: new Date().toISOString() });
  }
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const validateEnv = () => {
  const hasDbUrl = !!(process.env.MYSQL_URL || process.env.DATABASE_URL);
  const required = hasDbUrl
    ? ['JWT_SECRET']
    : ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[ENV] CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
    console.error('[ENV] The server may not function correctly without these variables.');
  } else {
    console.log('[ENV] All required environment variables are set.');
  }
  console.log(`[ENV] NODE_ENV=${process.env.NODE_ENV || '(not set)'}`);
  console.log(`[ENV] DB_SSL=${process.env.DB_SSL || '(not set)'}`);
  console.log(`[ENV] MYSQL_URL=${process.env.MYSQL_URL || process.env.DATABASE_URL ? '(set)' : '(not set)'}`);
  console.log(`[ENV] CLIENT_URL=${process.env.CLIENT_URL || '(not set - CORS will only allow localhost:5173)'}`);
  console.log(`[ENV] JWT_SECRET=${process.env.JWT_SECRET ? '(set)' : 'MISSING'}`);
};

const startServer = async () => {
  validateEnv();
  await initializeDatabase();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Listening on 0.0.0.0');
  });

  const { initSocket } = require('./utils/socket');
  initSocket(server);
};

startServer();

module.exports = { app };
