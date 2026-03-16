import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

const SESSION_COOKIE = "shopnet_session";
const enrichSessionFromDatabase = process.env.SESSION_ENRICH_FROM_DB === "true";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  location: string;
  mobileNumber?: string;
  profileImage?: string;
  shippingAddress?: string;
  role?: string;
};

type SessionToken = {
  id: string;
  email: string;
  name: string;
  location: string;
  role?: string;
};

type DbUser = {
  _id: unknown;
  name: string;
  email: string;
  location: string;
  mobileNumber?: string;
  profileImage?: string;
  shippingAddress?: string;
  role?: string;
};

function toSessionUserFromDb(dbUser: DbUser, fallbackRole?: string) {
  return {
    id: String(dbUser._id),
    name: dbUser.name,
    email: dbUser.email,
    location: dbUser.location,
    mobileNumber: dbUser.mobileNumber,
    profileImage: dbUser.profileImage,
    shippingAddress: dbUser.shippingAddress,
    role: dbUser.role || fallbackRole || "user"
  } as SessionUser;
}

function isMongoObjectId(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

function getSecret() {
  return process.env.JWT_SECRET || "shopnet-super-secret-change-me";
}

export function signSession(user: SessionUser) {
  const payload: SessionToken = {
    id: user.id,
    email: user.email,
    name: user.name,
    location: user.location,
    role: user.role
  };

  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  if (hasClerkKeys) {
    try {
      const clerkUser = await currentUser();

      if (clerkUser) {
        const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");

        return {
          id: clerkUser.id,
          email:
            clerkUser.primaryEmailAddress?.emailAddress ||
            clerkUser.emailAddresses[0]?.emailAddress ||
            "",
          name: fullName || clerkUser.username || "ShopNet User",
          location: "Not set",
          profileImage: clerkUser.imageUrl
        } as SessionUser;
      }
    } catch {
      // If Clerk is not fully configured yet, keep legacy JWT auth working.
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getSecret()) as SessionToken;

    // Legacy/demo sessions use non-Mongo IDs (e.g. `usr_xxx`); reject immediately.
    if (!isMongoObjectId(decoded.id)) {
      return null;
    }

    const fallbackUser: SessionUser = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      location: decoded.location,
      role: decoded.role
    };

    if (!enrichSessionFromDatabase) {
      return fallbackUser;
    }

    try {
      await connectToDatabase();

      let dbUser: DbUser | null = null;

      if (!dbUser && decoded.email) {
        dbUser = (await User.findOne({
          email: decoded.email.toLowerCase()
        }).lean()) as DbUser | null;
      }

      if (!dbUser && isMongoObjectId(decoded.id)) {
        dbUser = (await User.findById(decoded.id).lean()) as DbUser | null;
      }

      if (dbUser) {
        return toSessionUserFromDb(dbUser, decoded.role);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const expectedConnectionIssue =
        message.includes("MongoDB DNS lookup failed") ||
        message.includes("SRV DNS lookup failed recently") ||
        message.includes("getaddrinfo") ||
        message.includes("EAI_AGAIN") ||
        message.includes("SRV DNS lookup failed") ||
        message.includes("querySrv") ||
        message.includes("Server selection timed out") ||
        message.includes("Skipping new MongoDB attempts");

      if (!expectedConnectionIssue) {
        console.error(
          "MongoDB read failed in getSessionUser; using signed JWT claims only.",
          error
        );
      }

    }

    return fallbackUser;
  } catch {
    return null;
  }
}
