"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (signInError) {
      setError("Não foi possível entrar. Verifique seu e-mail e senha.");
      return;
    }

    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="email">
        E-mail
        <input className="h-10 rounded-md border bg-background px-3" id="email" name="email" required type="email" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium" htmlFor="password">
        Senha
        <input className="h-10 rounded-md border bg-background px-3" id="password" name="password" required type="password" />
      </label>
      {error ? <p aria-live="polite" className="text-sm text-red-600">{error}</p> : null}
      <button className="h-10 w-full rounded-md bg-primary px-4 font-medium text-primary-foreground disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
      <div className="flex justify-between text-sm">
        <Link className="text-primary underline-offset-4 hover:underline" href="/forgot-password">Esqueci minha senha</Link>
        <Link className="text-primary underline-offset-4 hover:underline" href="/signup">Criar conta</Link>
      </div>
    </form>
  );
}