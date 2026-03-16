import dns from "node:dns/promises";
import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI?.trim();
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 4000;
const DEFAULT_CONNECT_TIMEOUT_MS = 4000;
const DEFAULT_SOCKET_TIMEOUT_MS = 8000;
const DEFAULT_SRV_LOOKUP_TIMEOUT_MS = 1500;
const DEFAULT_CONNECT_RETRIES = 1;
const DEFAULT_CONNECT_RETRY_DELAY_MS = 750;
const DEFAULT_RETRY_COOLDOWN_MS = 10000;

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

const serverSelectionTimeoutMS = readPositiveInteger(
  process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
  DEFAULT_SERVER_SELECTION_TIMEOUT_MS
);
const connectTimeoutMS = readPositiveInteger(
  process.env.MONGODB_CONNECT_TIMEOUT_MS,
  DEFAULT_CONNECT_TIMEOUT_MS
);
const socketTimeoutMS = readPositiveInteger(
  process.env.MONGODB_SOCKET_TIMEOUT_MS,
  DEFAULT_SOCKET_TIMEOUT_MS
);
const srvLookupTimeoutMS = readPositiveInteger(
  process.env.MONGODB_SRV_LOOKUP_TIMEOUT_MS,
  DEFAULT_SRV_LOOKUP_TIMEOUT_MS
);
const connectRetryCount = readPositiveInteger(
  process.env.MONGODB_CONNECT_RETRIES,
  DEFAULT_CONNECT_RETRIES
);
const connectRetryDelayMS = readPositiveInteger(
  process.env.MONGODB_CONNECT_RETRY_DELAY_MS,
  DEFAULT_CONNECT_RETRY_DELAY_MS
);
const retryCooldownMS = readPositiveInteger(
  process.env.MONGODB_RETRY_COOLDOWN_MS,
  DEFAULT_RETRY_COOLDOWN_MS
);

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is required. Demo/mock fallback has been disabled, so the app only runs with a real database."
  );
}

const cache = global.mongooseCache || {
  conn: null,
  promise: null
};

global.mongooseCache = cache;

mongoose.set("bufferCommands", false);

export const dbEnabled = Boolean(MONGODB_URI);

let retryAfterTimestamp = 0;
let lastConnectionError: Error | null = null;
let lastSrvCheckUri: string | null = null;
let lastSrvCheckFailedAt = 0;
const mongoDnsHelp =
  "MongoDB DNS lookup failed. Check local DNS/network. If you are using an Atlas SRV URI, try the Atlas standard connection string.";

function normalizeMongoConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("MongoDB connection failed with an unknown error.");
  }

  const message = error.message || "";
  if (message.includes(mongoDnsHelp)) {
    return error;
  }

  const srvLookupFailed =
    message.includes("querySrv") ||
    message.includes("_mongodb._tcp") ||
    message.includes("ENOTFOUND") ||
    message.includes("ESERVFAIL") ||
    message.includes("EAI_AGAIN") ||
    message.includes("getaddrinfo");

  if (srvLookupFailed) {
    return new Error(`${message}\n${mongoDnsHelp}`);
  }

  return error;
}

function isRetryableMongoConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("eai_again") ||
    message.includes("enotfound") ||
    message.includes("eservfail") ||
    message.includes("getaddrinfo") ||
    message.includes("querysrv") ||
    message.includes("_mongodb._tcp") ||
    message.includes("server selection")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractSrvHost(uri: string) {
  if (!uri.startsWith("mongodb+srv://")) {
    return null;
  }

  const withoutProtocol = uri.slice("mongodb+srv://".length);
  const afterAuth = withoutProtocol.includes("@")
    ? withoutProtocol.slice(withoutProtocol.indexOf("@") + 1)
    : withoutProtocol;

  return afterAuth.split("/")[0]?.trim() || null;
}

async function preflightSrvLookup(uri: string) {
  if (!uri.startsWith("mongodb+srv://")) {
    return;
  }

  if (lastSrvCheckUri === uri && Date.now() - lastSrvCheckFailedAt < retryCooldownMS) {
    throw new Error(
      "MongoDB SRV DNS lookup failed recently. Check DNS/network or switch to an Atlas standard connection string."
    );
  }

  const host = extractSrvHost(uri);
  if (!host) {
    return;
  }

  const srvName = `_mongodb._tcp.${host}`;

  try {
    await Promise.race([
      dns.resolveSrv(srvName),
      new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new Error(`SRV DNS lookup timed out for ${srvName}`));
        }, srvLookupTimeoutMS)
      )
    ]);
    lastSrvCheckUri = uri;
    lastSrvCheckFailedAt = 0;
  } catch (error) {
    lastSrvCheckUri = uri;
    lastSrvCheckFailedAt = Date.now();
    throw normalizeMongoConnectionError(error);
  }
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    return null;
  }

  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  // Drop stale cached handles whenever Mongoose is not actually connected.
  if (cache.conn && mongoose.connection.readyState !== 1) {
    cache.conn = null;
    cache.promise = null;
  }

  if (Date.now() < retryAfterTimestamp && lastConnectionError) {
    const secondsRemaining = Math.max(
      1,
      Math.ceil((retryAfterTimestamp - Date.now()) / 1000)
    );
    throw new Error(
      `${lastConnectionError.message}\nSkipping new MongoDB attempts for ${secondsRemaining}s after the last failure.`
    );
  }

  if (!cache.promise) {
    cache.promise = (async () => {
      for (let attempt = 0; attempt <= connectRetryCount; attempt += 1) {
        try {
          await preflightSrvLookup(MONGODB_URI);
          return await mongoose.connect(MONGODB_URI, {
            dbName: "shopnet",
            serverSelectionTimeoutMS,
            connectTimeoutMS,
            socketTimeoutMS
          });
        } catch (error) {
          const normalizedError = normalizeMongoConnectionError(error);
          const shouldRetry =
            attempt < connectRetryCount && isRetryableMongoConnectionError(normalizedError);

          if (!shouldRetry) {
            throw normalizedError;
          }

          await delay(connectRetryDelayMS * (attempt + 1));
        }
      }

      throw new Error("MongoDB connection failed after retrying.");
    })().catch((error) => {
      cache.promise = null;
      const normalizedError = normalizeMongoConnectionError(error);
      lastConnectionError = normalizedError;
      retryAfterTimestamp = Date.now() + retryCooldownMS;
      throw normalizedError;
    });
  }

  try {
    cache.conn = await cache.promise;
    lastConnectionError = null;
    retryAfterTimestamp = 0;
    return cache.conn;
  } catch (error) {
    cache.conn = null;
    throw error;
  }
}
