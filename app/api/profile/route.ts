import { NextResponse } from "next/server";
import { updateUserProfile } from "@/lib/data";
import { getSessionUser, setSessionCookie, signSession } from "@/lib/session";
import { profileSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login before updating your profile." },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const data = profileSchema.parse(payload);
    const updatedUser = await updateUserProfile(user.id, {
      mobileNumber: data.mobileNumber,
      profileImage: data.profileImage || undefined,
      shippingAddress: data.shippingAddress || undefined
    });
    await setSessionCookie(signSession(updatedUser));

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update your profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
