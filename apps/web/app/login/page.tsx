import type { Metadata } from "next";
import LoginForm from "../../components/auth/login";

export const metadata: Metadata = {
  title: "Welcome back — VaultGraph",
  description: "Sign in to your VaultGraph workspace.",
};

export default function LoginPage() {
  return <LoginForm />;
}
