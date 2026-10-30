import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import hostelRoutes from "./routes/hostels.js";
import requestRoutes from "./routes/requests.js";
import contentRoutes from "./routes/content.js";
import feeRoutes from "./routes/fees.js";
import communityRoutes from "./routes/community.js";
import { connectDatabase } from "./database.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
app.set("trust proxy", 1);
app.use(async (_req, _res, next) => {
  try { await connectDatabase(); next(); } catch (error) { next(error); }
});
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use("/api/auth", authRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/community", communityRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Smart Hostel API" }));
app.use((err, _req, res, _next) => {
  if (err.code === "MONGO_URI_MISSING" || err.name === "MongoServerError" || err.name === "MongooseServerSelectionError") {
    console.error("[api] Database request failed.", {
      name: err.name,
      code: err.code,
      reason: String(err.reason?.message || err.message || "unknown error")
        .replace(/mongodb(?:\+srv)?:\/\/[^ ]+/gi, "mongodb://[redacted]"),
    });
    return res.status(503).json({ message: "Database unavailable. Check the server MongoDB configuration." });
  }
  console.error("[api] Request failed.", { name: err.name, code: err.code, message: err.message });
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});
const port = process.env.PORT || 5000;
if (process.env.VERCEL !== "1") {
  connectDatabase()
    .then(() => app.listen(port, () => console.log(`API listening on ${port}`)))
    .catch(() => process.exit(1));
}
export default app;
