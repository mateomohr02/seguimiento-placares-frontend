import type { Metadata } from "next";
import { LoginForm } from "@/modules/auth/components/login-form";

export const metadata: Metadata = { title: "Ingresar — Seguimiento Productivo" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 apaisado:py-4">
      <LoginForm />
    </main>
  );
}
