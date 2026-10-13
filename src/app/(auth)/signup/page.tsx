import { AuthCard } from "@/features/auth/presentation/auth-card";
import { SignupForm } from "@/features/auth/presentation/signup-form";

export const metadata = { title: "Criar conta" };

export default function SignupPage() {
  return <AuthCard description="Crie sua conta para começar a organizar suas finanças." title="Criar conta"><SignupForm /></AuthCard>;
}