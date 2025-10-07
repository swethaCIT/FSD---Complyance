import path from 'path';
import fs from 'fs';

const isVercel = !!process.env.VERCEL;

let useMemory = isVercel;
let Database;
try {
  if (!useMemory) {
    // eslint-disable-next-line unicorn/prefer-module
    Database = (await import('better-sqlite3')).default;
  }
} catch (e) {
  useMemory = true;
}

// In-memory fallback for Vercel/serverless
let memoryStore = [];
let autoId = 1;

let db;
if (!useMemory) {
  const dbPath = path.join(process.cwd(), 'data.db');
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
CREATE TABLE IF NOT EXISTS scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_name TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  results_json TEXT NOT NULL,
  email TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);
}

export function insertScenario({ scenario_name, inputs, results, email }) {
  if (useMemory) {
    const id = autoId++;
    const row = {
      id,
      scenario_name,
      inputs_json: JSON.stringify(inputs),
      results_json: JSON.stringify(results),
      email: email || null,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    memoryStore.unshift(row);
    return id;
  }
  const stmt = db.prepare('INSERT INTO scenarios (scenario_name, inputs_json, results_json, email) VALUES (?, ?, ?, ?)');
  const info = stmt.run(scenario_name, JSON.stringify(inputs), JSON.stringify(results), email || null);
  return info.lastInsertRowid;
}

export function listScenarios() {
  if (useMemory) {
    return memoryStore.map(r => ({ id: r.id, scenario_name: r.scenario_name, created_at: r.created_at }));
  }
  return db.prepare('SELECT id, scenario_name, created_at FROM scenarios ORDER BY id DESC').all();
}

export function getScenario(id) {
  if (useMemory) {
    const row = memoryStore.find(r => String(r.id) === String(id));
    if (!row) return null;
    return {
      id: row.id,
      scenario_name: row.scenario_name,
      email: row.email,
      created_at: row.created_at,
      inputs: JSON.parse(row.inputs_json),
      results: JSON.parse(row.results_json)
    };
  }
  const row = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id);
  if (!row) return null;
  return {
    id: row.id,
    scenario_name: row.scenario_name,
    email: row.email,
    created_at: row.created_at,
    inputs: JSON.parse(row.inputs_json),
    results: JSON.parse(row.results_json)
  };
}

export function deleteScenario(id) {
  if (useMemory) {
    const before = memoryStore.length;
    memoryStore = memoryStore.filter(r => String(r.id) !== String(id));
    return memoryStore.length !== before;
  }
  const info = db.prepare('DELETE FROM scenarios WHERE id = ?').run(id);
  return info.changes > 0;
}

export default db;


