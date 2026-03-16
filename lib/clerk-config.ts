function normalizeEnvValue(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .find(Boolean) || "";
}

const clerkPublishableKey = normalizeEnvValue(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);
const clerkSecretKey = normalizeEnvValue(process.env.CLERK_SECRET_KEY);

export { clerkPublishableKey, clerkSecretKey };
export const hasClerkKeys = Boolean(clerkPublishableKey && clerkSecretKey);
