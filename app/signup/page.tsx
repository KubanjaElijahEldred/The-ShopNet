import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { hasClerkKeys } from "@/lib/clerk-config";

export default function SignupPage() {
  return (
    <div className="unified-auth-page">
      <UnifiedAuthForm initialMode="signup" clerkEnabled={hasClerkKeys} />
    </div>
  );
}
