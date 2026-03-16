import {
  connectToDatabase,
  dbEnabled
} from "@/lib/db";
import { User } from "@/models/User";

const ONLINE_WINDOW_MS = 90_000;

type PresenceUserDoc = {
  _id: unknown;
  name?: string;
  email?: string;
  profileImage?: string;
  lastSeenAt?: unknown;
};

export type PresenceSnapshot = {
  id: string;
  name?: string;
  email?: string;
  profileImage?: string;
  lastSeenAt?: string;
  isOnline: boolean;
};

function normalizeErrorText(error: unknown) {
  const visited = new Set<unknown>();
  const queue: unknown[] = [error];
  const chunks: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) {
      continue;
    }

    if (typeof current === "object") {
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
    }

    if (current instanceof Error) {
      chunks.push(current.name, current.message, current.stack || "");
      const withMeta = current as Error & {
        code?: unknown;
        cause?: unknown;
        reason?: unknown;
      };

      if (withMeta.code != null) {
        chunks.push(String(withMeta.code));
      }
      if (withMeta.cause != null) {
        queue.push(withMeta.cause);
      }
      if (withMeta.reason != null) {
        queue.push(withMeta.reason);
      }
      continue;
    }

    if (
      typeof current === "string" ||
      typeof current === "number" ||
      typeof current === "boolean"
    ) {
      chunks.push(String(current));
      continue;
    }

    if (typeof current === "object") {
      const record = current as Record<string, unknown>;
      const probableTextKeys = [
        "name",
        "message",
        "stack",
        "code",
        "detail",
        "error",
        "reason",
        "cause"
      ];

      probableTextKeys.forEach((key) => {
        const value = record[key];
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          chunks.push(String(value));
        } else if (value && typeof value === "object") {
          queue.push(value);
        }
      });

      try {
        chunks.push(JSON.stringify(current));
      } catch {
        chunks.push(String(current));
      }
      continue;
    }

    chunks.push(String(current));
  }

  return chunks.join(" ").toLowerCase();
}

function isExpectedTransientIssue(error: unknown) {
  const normalized = normalizeErrorText(error);
  return (
    normalized.includes("timed out") ||
    normalized.includes("timeout") ||
    normalized.includes("srv dns lookup failed") ||
    normalized.includes("mongodb dns lookup failed") ||
    normalized.includes("getaddrinfo") ||
    normalized.includes("querysrv") ||
    normalized.includes("_mongodb._tcp") ||
    normalized.includes("eservfail") ||
    normalized.includes("skipping new mongodb attempts") ||
    normalized.includes("eai_again") ||
    normalized.includes("enotfound") ||
    normalized.includes("server selection") ||
    normalized.includes("topology is closed")
  );
}

function isMongoObjectId(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

function asIsoTimestamp(value: unknown) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return undefined;
}

export function isOnlineFromTimestamp(lastSeenAt?: string) {
  if (!lastSeenAt) {
    return false;
  }

  const parsed = Date.parse(lastSeenAt);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return Date.now() - parsed <= ONLINE_WINDOW_MS;
}

export async function getUserPresenceMap(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const presenceMap = new Map<string, PresenceSnapshot>();

  if (!dbEnabled || uniqueIds.length === 0) {
    return presenceMap;
  }

  const mongoIds = uniqueIds.filter(isMongoObjectId);

  if (mongoIds.length === 0) {
    return presenceMap;
  }

  try {
    await connectToDatabase();

    const users = (await User.find({ _id: { $in: mongoIds } })
      .select("_id name email profileImage lastSeenAt")
      .lean()) as PresenceUserDoc[];

    users.forEach((user) => {
      const id = String(user._id);
      const lastSeenAt = asIsoTimestamp(user.lastSeenAt);

      presenceMap.set(id, {
        id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        lastSeenAt,
        isOnline: isOnlineFromTimestamp(lastSeenAt)
      });
    });
  } catch (error) {
    if (!isExpectedTransientIssue(error)) {
      console.error("MongoDB read failed in getUserPresenceMap.", error);
    }
  }

  return presenceMap;
}

export async function touchUserPresence(user: { id: string; email: string }) {
  if (!dbEnabled) {
    return;
  }

  try {
    await connectToDatabase();
    const now = new Date();
    const normalizedEmail = user.email.trim().toLowerCase();
    let matchedByEmail = false;

    if (normalizedEmail) {
      const updated = (await User.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { lastSeenAt: now } },
        { new: false }
      )
        .select("_id")
        .lean()) as { _id?: unknown } | null;

      matchedByEmail = Boolean(updated?._id);
    }

    if (!matchedByEmail && isMongoObjectId(user.id)) {
      await User.findByIdAndUpdate(user.id, { $set: { lastSeenAt: now } })
        .select("_id")
        .lean();
    }
  } catch (error) {
    if (!isExpectedTransientIssue(error)) {
      console.error("MongoDB write failed in touchUserPresence.", error);
    }
  }
}
