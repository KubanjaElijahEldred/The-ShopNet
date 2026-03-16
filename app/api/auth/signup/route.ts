import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createUser } from "@/lib/data";
import { setSessionCookie, signSession } from "@/lib/session";
import { signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = signupSchema.parse(payload);
    const user = await createUser(data);
    const token = signSession(user);
    await setSessionCookie(token);

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

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
