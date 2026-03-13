import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";

const SESSION_COOKIE = "shopnet_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  location: string;
  mobileNumber?: string;
  profileImage?: string;
  shippingAddress?: string;
};

function getSecret() {
  return process.env.JWT_SECRET || "shopnet-super-secret-change-me";
}

export function signSession(user: SessionUser) {
  return jwt.sign(user, getSecret(), { expiresIn: "7d" });
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
  try {
    const clerkUser = await currentUser();

    if (clerkUser) {
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");

      return {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || "",
        name: fullName || clerkUser.username || "ShopNet User",
        location: "Not set",
        profileImage: clerkUser.imageUrl
      } as SessionUser;
    }
  } catch {
    // If Clerk is not fully configured yet, keep legacy JWT auth working.
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, getSecret()) as SessionUser;
  } catch {
    return null;
  }
}
