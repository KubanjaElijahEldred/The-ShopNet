import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authenticateUser } from "@/lib/data";
import { setSessionCookie, signSession } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = loginSchema.parse(payload);
    const user = await authenticateUser(data.email, data.password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = signSession(user);
    await setSessionCookie(token);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid login details." },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unable to login.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
