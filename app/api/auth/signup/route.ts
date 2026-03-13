import { NextResponse } from "next/server";
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
    const message =
      error instanceof Error ? error.message : "Unable to create your account.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
