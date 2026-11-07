import mongoose from "mongoose";

// Cache the connection promise so serverless warm invocations reuse it
// instead of opening a new connection on every request.
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, reuse the connection
  if (cached.conn) {
    return cached.conn;
  }

  // Guard: fail fast if the env var is missing
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI environment variable is not set. " +
      "Add it in Vercel: Settings → Environment Variables."
    );
  }

  // Start a new connection promise if none exists
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,  // fail after 10s instead of hanging
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    // Reset so the next request tries again
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB Connection Error:", error.message);
    throw error;  // bubbles up to the middleware with the real message
  }

  return cached.conn;
};

export default connectDB;
