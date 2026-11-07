import mongoose from "mongoose";

// Cache the connection promise so serverless warm invocations reuse it
// instead of opening a new connection on every request.
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB Connection Error:", error.message);
    throw error;
  }

  return cached.conn;
};

export default connectDB;
