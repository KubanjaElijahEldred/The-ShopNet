import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { hasClerkKeys } from "@/lib/clerk-config";

const clerkHandler = clerkMiddleware();

export default hasClerkKeys ? clerkHandler : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
