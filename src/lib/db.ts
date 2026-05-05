import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), "farming.db");
const db = new Database(dbPath);

export function initDb() {
  // Crops Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      ideal_ph_min REAL,
      ideal_ph_max REAL,
      nitrogen_req TEXT,
      phosphorus_req TEXT,
      potassium_req TEXT,
      climate TEXT,
      growing_days INTEGER,
      estimated_cost_per_acre REAL,
      description TEXT
    )
  `);

  // History / Reports Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      soil_data TEXT, -- JSON string
      analysis TEXT,  -- JSON string
      region TEXT
    )
  `);

  // Seed data if empty
  const count = db.prepare("SELECT COUNT(*) as count FROM crops").get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO crops (name, type, ideal_ph_min, ideal_ph_max, nitrogen_req, phosphorus_req, potassium_req, climate, growing_days, estimated_cost_per_acre, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleCrops = [
      ["Rice", "Cereal", 5.5, 7.0, "High", "Medium", "Low", "Tropical, Wet", 120, 15000, "Staple crop, needs plenty of water."],
      ["Wheat", "Cereal", 6.0, 7.5, "Medium", "Medium", "Medium", "Temperate, Cool", 110, 12000, "Best grown in winter."],
      ["Maize", "Cereal", 5.8, 7.0, "High", "High", "Medium", "Wide range", 100, 10000, "Versatile crop for food and fodder."],
      ["Cotton", "Fiber", 5.8, 8.0, "Medium", "Medium", "High", "Warm, Dry", 180, 20000, "Requires warm climate and moderate rainfall."],
      ["Sugarcane", "Cash Crop", 6.0, 7.5, "Very High", "Medium", "High", "Tropical", 360, 35000, "Long duration crop, high water demand."]
    ];

    for (const crop of sampleCrops) {
      insert.run(...crop);
    }
  }
}

export function getCrops() {
  return db.prepare("SELECT * FROM crops").all();
}

export function saveReport(report: any) {
  const stmt = db.prepare("INSERT INTO reports (soil_data, analysis, region) VALUES (?, ?, ?)");
  return stmt.run(JSON.stringify(report.soilData), JSON.stringify(report.analysis), report.region);
}

export function getHistory() {
  return db.prepare("SELECT * FROM reports ORDER BY created_at DESC").all();
}
