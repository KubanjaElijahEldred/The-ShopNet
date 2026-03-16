import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createUser } from "@/lib/data";
import { setSessionCookie, signSession } from "@/lib/session";
import { signupSchema } from "@/lib/validators";
import { sendWelcomeEmail } from "@/lib/email";

function statusFromSignupError(message: string) {
  if (message.includes("already has an account") || message.includes("already in use")) {
    return 409;
  }

  if (
    message.includes("Server selection timed out") ||
    message.includes("Skipping new MongoDB attempts") ||
    message.includes("could not connect")
  ) {
    return 503;
  }

  return 400;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = signupSchema.parse(payload);
    const user = await createUser(data);
    const token = signSession(user);
    await setSessionCookie(token);
    try {
      await sendWelcomeEmail({
        to: user.email,
        userName: user.name
      });
    } catch (error) {
      console.error("Failed to send signup welcome email.", error);
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid signup details." },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to create your account.";

    return NextResponse.json({ error: message }, { status: statusFromSignupError(message) });
  }
}
