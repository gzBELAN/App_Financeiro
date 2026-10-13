import { AuthCard } from "@/features/auth/presentation/auth-card";
import { ResetPasswordForm } from "@/features/auth/presentation/reset-password-form";

export const metadata = { title: "Redefinir senha" };

export default function ResetPasswordPage() {
  return <AuthCard description="Defina uma nova senha para sua conta." title="Redefinir senha"><ResetPasswordForm /></AuthCard>;
}