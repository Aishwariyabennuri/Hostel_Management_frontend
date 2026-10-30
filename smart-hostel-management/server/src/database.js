import mongoose from "mongoose";

let connectionPromise;

function databaseTarget(uri) {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return "invalid MongoDB URI";
  }
}

function safeReason(error) {
  return String(error.reason?.message || error.message || "unknown error")
    .replace(/mongodb(?:\+srv)?:\/\/[^ ]+/gi, "mongodb://[redacted]");
}

export function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    const error = new Error("MONGO_URI is not configured.");
    error.code = "MONGO_URI_MISSING";
    return Promise.reject(error);
  }

  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (connectionPromise) return connectionPromise;

  console.info(`[database] Connecting to ${databaseTarget(uri)}`);
  connectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  }).then(connection => {
    console.info("[database] MongoDB connection established.");
    return connection;
  }).catch(error => {
    connectionPromise = undefined;
    console.error("[database] MongoDB connection failed.", {
      code: error.code,
      name: error.name,
      reason: safeReason(error),
    });
    throw error;
  });

  return connectionPromise;
}
