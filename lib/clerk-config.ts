function normalizeEnvValue(value?: string) {
  if (!value) {
    return "";
  }

  // Some deployments accidentally paste comma-separated values into one variable.
  return value
    .split(",")
    .map((part) => part.trim())
    .find(Boolean) || "";
}

function asBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function readOptionalBoolean(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return asBoolean(normalized);
}

const clerkPublishableKey = normalizeEnvValue(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);
const clerkSecretKey = normalizeEnvValue(process.env.CLERK_SECRET_KEY);
const isDevelopment = process.env.NODE_ENV !== "production";
const enableClerkInDevFlag = readOptionalBoolean(
  normalizeEnvValue(process.env.NEXT_PUBLIC_ENABLE_CLERK_IN_DEV)
);
const enableClerkInDev = enableClerkInDevFlag ?? false;

export { clerkPublishableKey, clerkSecretKey };
export const hasClerkKeys = Boolean(
  clerkPublishableKey &&
    clerkSecretKey &&
    (!isDevelopment || enableClerkInDev)
);
