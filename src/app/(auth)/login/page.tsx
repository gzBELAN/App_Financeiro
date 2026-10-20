import { Suspense } from "react";

import { LoginForm } from "@/features/auth/presentation/login-form";
import { AuthCard } from "@/features/auth/presentation/auth-card";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthCard description="Entre para acompanhar sua vida financeira." title="Boas-vindas">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando formulário...</p>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}