import { AuthCard } from "./components/AuthCard";
import { BrandMark } from "./components/BrandMark";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  return (
    <AuthCard mark={<BrandMark />} subtitle="NTS School System" title="Sign in to your account">
      <LoginForm />
    </AuthCard>
  );
}
