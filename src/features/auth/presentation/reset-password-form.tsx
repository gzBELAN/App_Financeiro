"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
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
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError("Não foi possível atualizar a senha. Solicite um novo link de recuperação.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="password">
        Nova senha
        <input className="h-10 rounded-md border bg-background px-3" id="password" minLength={8} name="password" required type="password" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="confirmPassword">
        Confirmar nova senha
        <input className="h-10 rounded-md border bg-background px-3" id="confirmPassword" minLength={8} name="confirmPassword" required type="password" />
      </label>
      {error ? <p aria-live="polite" className="text-sm text-red-600">{error}</p> : null}
      <button className="h-10 w-full rounded-md bg-primary px-4 font-medium text-primary-foreground disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Atualizando..." : "Atualizar senha"}
      </button>
    </form>
  );
}