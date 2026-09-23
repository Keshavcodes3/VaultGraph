import type { Metadata } from "next";
import RegisterForm from "../../components/auth/register";

export const metadata: Metadata = {
  title: "Create your workspace — VaultGraph",
  description: "Create a VaultGraph workspace. A quiet place for everything you know.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
