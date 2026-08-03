const mysql = require('mysql2/promise');

require('dotenv').config();

const BATCH_SIZE = 500;

const toInsertValue = (value) => {
  if (typeof value === 'object' && value !== null && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return value;
};

const parseDbUrl = (dbUrl) => {
  const parsed = new URL(dbUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: (parsed.pathname || '/').replace(/^\//, '') || 'defaultdb'
  };
};

const requireUrl = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`[migrate] MISSING environment variable: ${name}`);
    process.exit(1);
  }
  return value;
};

const sourceUrl = requireUrl('SOURCE_MYSQL_URL');
const destUrl = requireUrl('DEST_MYSQL_URL');

const srcConfig = { ...parseDbUrl(sourceUrl), ssl: { rejectUnauthorized: false } };
const dstConfig = { ...parseDbUrl(destUrl), ssl: { rejectUnauthorized: false } };

async function main() {
  console.log(`[migrate] Source: ${srcConfig.host}/${srcConfig.database}`);
  console.log(`[migrate] Dest:   ${dstConfig.host}/${dstConfig.database}`);
  console.log('');

  const src = await mysql.createConnection(srcConfig);
  const dst = await mysql.createConnection(dstConfig);
  console.log('[migrate] Connected to both databases.\n');

  const [tables] = await src.query(
    'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name',
    [srcConfig.database]
  );

  if (tables.length === 0) {
    console.error('[migrate] No tables found in source database. Aborting.');
    process.exit(1);
  }

  console.log(`[migrate] Found ${tables.length} table(s) to migrate.\n`);

  await dst.query('SET FOREIGN_KEY_CHECKS = 0');
  await dst.query('SET SQL_MODE = ""');

  let totalRows = 0;
  for (const { name: table } of tables) {
    const [[createResult]] = await src.query(`SHOW CREATE TABLE \`${table}\``);
    const ddl = createResult['Create Table'];

    await dst.query(`DROP TABLE IF EXISTS \`${table}\``);
    await dst.query(ddl);

    const [columns] = await src.query(
      `SELECT column_name AS name FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ? AND extra NOT LIKE '%GENERATED%'
       ORDER BY ordinal_position`,
      [srcConfig.database, table]
    );

    const colNames = columns.map((c) => c.name);
    if (colNames.length === 0) {
      console.log(`  - ${table}: 0 rows (no insertable columns)`);
      continue;
    }

    const selectCols = colNames.map((c) => `\`${c}\``).join(', ');
    const insertCols = colNames.map((c) => `\`${c}\``).join(', ');

    let count = 0;
    const [rows] = await src.query(`SELECT ${selectCols} FROM \`${table}\``);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((row) => Object.values(row).map(toInsertValue));
      await dst.query(`INSERT INTO \`${table}\` (${insertCols}) VALUES ?`, [batch]);
      count += batch.length;
    }

    totalRows += count;
    console.log(`  - ${table}: ${count} row(s) copied`);
  }

  await dst.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log(`\n[migrate] Done. ${totalRows} total row(s) migrated to ${dstConfig.host}/${dstConfig.database}.`);
  await src.end();
  await dst.end();
}

main().catch((err) => {
  console.error('[migrate] FAILED:', err.message);
  process.exit(1);
});
