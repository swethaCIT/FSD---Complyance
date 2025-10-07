import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data.db');

// Ensure DB file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
}

const db = new Database(dbPath);

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

export function insertScenario({ scenario_name, inputs, results, email }) {
  const stmt = db.prepare(
    'INSERT INTO scenarios (scenario_name, inputs_json, results_json, email) VALUES (?, ?, ?, ?)' 
  );
  const info = stmt.run(
    scenario_name,
    JSON.stringify(inputs),
    JSON.stringify(results),
    email || null
  );
  return info.lastInsertRowid;
}

export function listScenarios() {
  const rows = db.prepare('SELECT id, scenario_name, created_at FROM scenarios ORDER BY id DESC').all();
  return rows;
}

export function getScenario(id) {
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
  const info = db.prepare('DELETE FROM scenarios WHERE id = ?').run(id);
  return info.changes > 0;
}

export default db;


