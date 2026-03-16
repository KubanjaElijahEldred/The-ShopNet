import mongoose from "mongoose";

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

const cache = global.mongooseCache || {
  conn: null,
  promise: null
};

global.mongooseCache = cache;

export const dbEnabled = Boolean(MONGODB_URI);

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    return null;
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      dbName: "shopnet"
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
