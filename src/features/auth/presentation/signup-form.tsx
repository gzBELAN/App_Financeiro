"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get("displayName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("A confirmação de senha não corresponde à senha informada.");
      return;
    }

    setIsSubmitting(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error: signUpError } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: redirectTo,
      },
    });
    setIsSubmitting(false);

    if (signUpError) {
      setError("Não foi possível criar a conta. Tente novamente com outro e-mail.");
      return;
    }

    setIsSuccess(true);
  }

  if (isSuccess) {
    return <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.</p>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="displayName">
        Nome
        <input className="h-10 rounded-md border bg-background px-3" id="displayName" name="displayName" required type="text" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="email">
        E-mail
        <input className="h-10 rounded-md border bg-background px-3" id="email" name="email" required type="email" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="password">
        Senha
        <input className="h-10 rounded-md border bg-background px-3" id="password" minLength={8} name="password" required type="password" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="confirmPassword">
        Confirmar senha
        <input className="h-10 rounded-md border bg-background px-3" id="confirmPassword" minLength={8} name="confirmPassword" required type="password" />
      </label>
      {error ? <p aria-live="polite" className="text-sm text-red-600">{error}</p> : null}
      <button className="h-10 w-full rounded-md bg-primary px-4 font-medium text-primary-foreground disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </button>
      <p className="text-center text-sm text-muted-foreground">Já possui uma conta? <Link className="text-primary underline-offset-4 hover:underline" href="/login">Entrar</Link></p>
    </form>
  );
}