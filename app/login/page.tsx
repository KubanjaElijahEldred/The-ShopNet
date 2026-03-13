import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";

export default function LoginPage() {
  return (
    <div className="unified-auth-page">
      <UnifiedAuthForm initialMode="signin" />
    </div>
  );
}
