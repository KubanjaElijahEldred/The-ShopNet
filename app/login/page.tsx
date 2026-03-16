import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { hasClerkKeys } from "@/lib/clerk-config";

export default function LoginPage() {
  return (
    <div className="unified-auth-page">
      <UnifiedAuthForm initialMode="signin" clerkEnabled={hasClerkKeys} />
    </div>
  );
}
