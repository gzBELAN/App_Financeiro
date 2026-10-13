import { AuthCard } from "@/features/auth/presentation/auth-card";
import { ForgotPasswordForm } from "@/features/auth/presentation/forgot-password-form";

export const metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return <AuthCard description="Informe seu e-mail para receber as instruções de recuperação." title="Recuperar senha"><ForgotPasswordForm /></AuthCard>;
}