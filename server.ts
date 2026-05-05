import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { initDb, saveReport, getCrops, getHistory } from "./src/lib/db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: "uploads/" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initDb();

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/crops", (req, res) => {
    const crops = getCrops();
    res.json(crops);
  });

  app.get("/api/history", (req, res) => {
    const history = getHistory();
    res.json(history);
  });

  app.post("/api/save-analysis", (req, res) => {
    try {
      const report = req.body;
      const result = saveReport(report);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error("Save analysis error:", error);
      res.status(500).json({ error: "Failed to save analysis" });
    }
  });

  app.post("/api/upload-report", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    try {
      // In a real app, you'd process the file with Gemini here.
      // But we'll do the actual OCR on the client-side using the Gemini SDK 
      // as per 'gemini-api' skill instructions (ALWAYS call from frontend).
      // This endpoint is just a placeholder if needed, or for storing artifacts.
      res.json({ filePath: req.file.path, originalName: req.file.originalname });
    } catch (error) {
      res.status(500).json({ error: "File processing failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
