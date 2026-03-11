import express from "express";
import { createServer as createViteServer } from "vite";
import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const db = new Database("painpoint.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    expires_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saved_pain_points (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    platform TEXT,
    source TEXT,
    postTitle TEXT,
    postUrl TEXT,
    postDate TEXT,
    painPoint TEXT,
    userQuote TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saved_saas_ideas (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    description TEXT,
    targetAudience TEXT,
    potentialFeatures TEXT,
    complexity TEXT,
    monetization TEXT,
    sourcePainPoint TEXT,
    platform TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Mistral Client
  const apiKey = process.env.MISTRAL_API_KEY;
  const client = apiKey ? new Mistral({ apiKey }) : null;

  // Auth Middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.status(401).json({ error: "Unauthorized" });

    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as any;
    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.userId = session.user_id;
    next();
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      db.prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)").run(userId, email, hashedPassword);
      
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days
      db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(sessionId, userId, expiresAt);

      res.cookie("sessionId", sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ success: true, user: { email } });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(sessionId, user.id, expiresAt);

    res.cookie("sessionId", sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ success: true, user: { email } });
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.cookies.sessionId;
    if (sessionId) db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    res.clearCookie("sessionId");
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.json({ user: null });

    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as any;
    if (!session || new Date(session.expires_at) < new Date()) {
      return res.json({ user: null });
    }

    const user = db.prepare("SELECT email FROM users WHERE id = ?").get(session.user_id) as any;
    res.json({ user });
  });

  // Data Routes
  app.post("/api/analyze", authMiddleware, async (req: any, res) => {
    if (!client) {
      return res.status(500).json({ error: "MISTRAL_API_KEY is not configured." });
    }

    const { niches, platforms, isDeepSearch } = req.body;
    const count = isDeepSearch ? "12-15" : "5-8";

    const prompt = `
      You are an expert market researcher. 
      Analyze the following niches: ${niches.join(', ')}.
      Platforms to consider: ${platforms.join(' & ')}.
      
      Identify ${count} distinct pain points that people are currently discussing or experiencing in these niches on these platforms.
      For each pain point, generate a Micro SaaS idea that solves it.
      
      Return ONLY a structured JSON object with the following schema:
      {
        "painPoints": [
          {
            "platform": "Reddit | Quora",
            "source": "string",
            "postTitle": "string",
            "postUrl": "string",
            "postDate": "string",
            "painPoint": "string",
            "userQuote": "string"
          }
        ],
        "saasIdeas": [
          {
            "title": "string",
            "description": "string",
            "targetAudience": "string",
            "potentialFeatures": ["string"],
            "complexity": "Low | Medium | High",
            "monetization": "string",
            "sourcePainPoint": "string",
            "platform": "Reddit | Quora"
          }
        ]
      }
    `;

    try {
      const response = await client.chat.complete({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        responseFormat: { type: "json_object" }
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        res.json(JSON.parse(content));
      } else {
        throw new Error("Invalid response from Mistral");
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to analyze" });
    }
  });

  app.post("/api/save/pain-point", authMiddleware, (req: any, res) => {
    const { platform, source, postTitle, postUrl, postDate, painPoint, userQuote } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO saved_pain_points (id, user_id, platform, source, postTitle, postUrl, postDate, painPoint, userQuote)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, platform, source, postTitle, postUrl, postDate, painPoint, userQuote);
    res.json({ success: true, id });
  });

  app.post("/api/save/saas-idea", authMiddleware, (req: any, res) => {
    const { title, description, targetAudience, potentialFeatures, complexity, monetization, sourcePainPoint, platform } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO saved_saas_ideas (id, user_id, title, description, targetAudience, potentialFeatures, complexity, monetization, sourcePainPoint, platform)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, title, description, targetAudience, JSON.stringify(potentialFeatures), complexity, monetization, sourcePainPoint, platform);
    res.json({ success: true, id });
  });

  app.get("/api/saved", authMiddleware, (req: any, res) => {
    const painPoints = db.prepare("SELECT * FROM saved_pain_points WHERE user_id = ?").all(req.userId);
    const saasIdeas = db.prepare("SELECT * FROM saved_saas_ideas WHERE user_id = ?").all(req.userId);
    
    res.json({
      painPoints,
      saasIdeas: saasIdeas.map((idea: any) => ({
        ...idea,
        potentialFeatures: JSON.parse(idea.potentialFeatures)
      }))
    });
  });

  app.delete("/api/saved/:type/:id", authMiddleware, (req: any, res) => {
    const { type, id } = req.params;
    const table = type === 'pain-point' ? 'saved_pain_points' : 'saved_saas_ideas';
    db.prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`).run(id, req.userId);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
