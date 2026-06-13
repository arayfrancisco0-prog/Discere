const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel
  ? '/tmp/discere.db'
  : path.join(__dirname, 'data', 'discere.db');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    await createSchema();
    await seedFromJson();
  }

  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  return db;
}

async function createSchema() {
  const { createSchema: schema } = require('./schema');
  schema(db);
}

async function seedFromJson() {
  const seedPath = path.join(__dirname, 'seed-data.json');
  if (!fs.existsSync(seedPath)) return;

  const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  for (const [table, rows] of Object.entries(data)) {
    if (!rows.length) continue;
    const keys = Object.keys(rows[0]);
    const placeholders = keys.map(() => '?').join(',');
    const stmt = db.prepare(`INSERT OR IGNORE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
    for (const row of rows) {
      stmt.run(keys.map(k => row[k]));
    }
    stmt.free();
  }
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function queryValue(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let val = null;
  if (stmt.step()) val = stmt.get()[0];
  stmt.free();
  return val;
}

function execute(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  stmt.step();
  stmt.free();
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function closeDb() {
  if (db) { saveDb(); db.close(); db = null; }
}

module.exports = { getDb, queryAll, queryOne, queryValue, execute, saveDb, closeDb };
