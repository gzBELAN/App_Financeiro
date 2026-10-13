"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
    setIsSubmitting(false);

    if (resetError) {
      setError("Não foi possível solicitar a recuperação. Tente novamente.");
      return;
    }

    setIsSuccess(true);
  }

  if (isSuccess) {
    return <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.</p>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="email">
        E-mail
        <input className="h-10 rounded-md border bg-background px-3" id="email" name="email" required type="email" />
      </label>
      {error ? <p aria-live="polite" className="text-sm text-red-600">{error}</p> : null}
      <button className="h-10 w-full rounded-md bg-primary px-4 font-medium text-primary-foreground disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Enviando..." : "Enviar instruções"}
      </button>
      <Link className="block text-center text-sm text-primary underline-offset-4 hover:underline" href="/login">Voltar para entrar</Link>
    </form>
  );
}