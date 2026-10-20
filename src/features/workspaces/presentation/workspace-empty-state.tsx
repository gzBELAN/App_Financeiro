"use client";

import { FormEvent, useState, useTransition } from "react";

import { createWorkspace } from "@/features/workspaces/application/workspace-actions";

export function WorkspaceEmptyState() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      const result = await createWorkspace({}, new FormData(form));
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) form.reset();
    });
  }

  return <main className="container flex min-h-[calc(100vh-4rem)] items-center py-8"><section className="mx-auto w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm"><p className="text-sm font-medium text-primary">Primeiros passos</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Você ainda não participa de um controle financeiro</h1><p className="mt-3 text-muted-foreground">Crie um controle para começar a organizar suas finanças ou aguarde o convite de alguém. Quando for adicionado a um controle compartilhado, ele aparecerá automaticamente na sua conta.</p><form className="mt-6 space-y-3" onSubmit={submit}><label className="grid gap-1.5 text-sm font-medium">Nome do novo controle<input className="h-10 rounded-md border bg-background px-3" maxLength={100} name="name" placeholder="Ex.: Minhas finanças" required /></label><button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "Criando..." : "Criar controle financeiro"}</button></form>{feedback ? <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{feedback}</p> : null}</section></main>;
}
