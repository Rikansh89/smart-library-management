const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'libramind.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;
let SQL = null;
let saveInterval = null;

function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (err) {
      console.error('Failed to save database:', err.message);
    }
  }
}

function createStatementWrapper(stmt) {
  return {
    run(...params) {
      try {
        stmt.bind(params);
        stmt.run();
        const idResult = db.exec("SELECT last_insert_rowid() as id");
        const chResult = db.exec("SELECT changes() as count");
        stmt.free();
        saveDatabase();
        return {
          lastInsertRowid: idResult.length && idResult[0].values.length ? idResult[0].values[0][0] : 0,
          changes: chResult.length && chResult[0].values.length ? chResult[0].values[0][0] : 0
        };
      } catch (err) {
        stmt.free();
        throw new Error(`SQL run error: ${err.message}`);
      }
    },
    get(...params) {
      try {
        if (params.length > 0) stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      } catch (err) {
        stmt.free();
        throw new Error(`SQL get error: ${err.message}`);
      }
    },
    all(...params) {
      try {
        if (params.length > 0) stmt.bind(params);
        const rows = [];
        const cols = stmt.getColumnNames();
        while (stmt.step()) {
          const vals = stmt.get();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          rows.push(row);
        }
        stmt.free();
        return rows;
      } catch (err) {
        stmt.free();
        throw new Error(`SQL all error: ${err.message}`);
      }
    }
  };
}

function prepare(sql) {
  try {
    const stmt = db.prepare(sql);
    return createStatementWrapper(stmt);
  } catch (err) {
    throw new Error(`SQL prepare error: ${err.message}\nSQL: ${sql}`);
  }
}

function exec(sql) {
  try {
    db.exec(sql);
    if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql)) {
      saveDatabase();
    }
  } catch (err) {
    throw new Error(`SQL exec error: ${err.message}\nSQL: ${sql}`);
  }
}

function pragma(str) {
  exec(`PRAGMA ${str}`);
}

function getDatabase() {
  return { prepare, exec, pragma, _raw: db, save: saveDatabase };
}

async function initDatabase() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (db) {
    saveDatabase();
    db.close();
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  pragma('journal_mode = DELETE');
  pragma('foreign_keys = ON');

  if (saveInterval) clearInterval(saveInterval);
  saveInterval = setInterval(saveDatabase, 5000);

  return getDatabase();
}

function closeDatabase() {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
  saveDatabase();
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, initDatabase, closeDatabase, saveDatabase };
