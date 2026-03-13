import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";

export default function SignupPage() {
  return (
    <div className="unified-auth-page">
      <UnifiedAuthForm initialMode="signup" />
    </div>
  );
}
