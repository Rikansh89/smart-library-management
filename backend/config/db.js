const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const parseDbUrl = () => {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (!dbUrl) return null;
  const parsed = new URL(dbUrl);
  return {
    host: parsed.hostname,
    port: parsed.port || '3306',
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: (parsed.pathname || '/').replace(/^\//, '') || 'defaultdb'
  };
};

const urlConfig = parseDbUrl();

const dbConfig = {
  host: urlConfig ? urlConfig.host : process.env.DB_HOST,
  port: urlConfig ? Number(urlConfig.port || 3306) : Number(process.env.DB_PORT || 3306),
  user: urlConfig ? urlConfig.user : process.env.DB_USER,
  password: urlConfig ? urlConfig.password : process.env.DB_PASSWORD,
  database: urlConfig ? urlConfig.database : process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(process.env.DB_SSL === 'true' || urlConfig
    ? { ssl: { rejectUnauthorized: false } }
    : {})
};

const dbName = urlConfig ? urlConfig.database : process.env.DB_NAME;

const pool = mysql.createPool(dbConfig);

pool.on('connection', (connection) => {
  console.log('[DB] New connection established.');
});

pool.on('acquire', (connection) => {
  console.log('[DB] Connection acquired from pool.');
});

pool.on('release', (connection) => {
  console.log('[DB] Connection released back to pool.');
});

pool.on('enqueue', () => {
  console.warn('[DB] Waiting for available connection slot.');
});

const initializeDatabase = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Database connected successfully.');

    const [tables] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [dbName]
    );

    if (tables.length === 0) {
      console.log('No tables found. Running schema.sql...');
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toUpperCase().startsWith('CREATE DATABASE') || statement.toUpperCase().startsWith('USE ')) {
          continue;
        }
        await connection.query(statement);
      }
      console.log('Schema imported successfully.');
    } else {
      console.log(`Database initialized with ${tables.length} table(s). Skipping schema import.`);
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
    console.error('WARNING: Server starting without database verification. Ensure schema.sql has been imported.');
  } finally {
    if (connection) connection.release();
  }
};

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
