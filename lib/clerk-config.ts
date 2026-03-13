const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkSecretKey = process.env.CLERK_SECRET_KEY ?? "";

export { clerkPublishableKey, clerkSecretKey };
export const hasClerkKeys = Boolean(clerkPublishableKey && clerkSecretKey);
