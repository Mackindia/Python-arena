import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongoose_cache__: MongooseCache | undefined;
}

const cache: MongooseCache = global.__mongoose_cache__ ?? { conn: null, promise: null };

if (!global.__mongoose_cache__) {
  global.__mongoose_cache__ = cache;
}

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing");
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    mongoose.set("bufferCommands", false);

    cache.promise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 5000,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}