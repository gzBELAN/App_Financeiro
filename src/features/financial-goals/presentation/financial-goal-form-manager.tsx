"use client";

import { type FormEvent, useState, useTransition } from "react";

import { archiveFinancialGoal, createFinancialGoal, updateFinancialGoal } from "@/features/financial-goals/application/financial-goal-actions";
import type { FinancialGoal } from "@/features/financial-goals/domain/financial-goal";

const currencyInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
const currency = (cents: number) => new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);

export function FinancialGoalFormManager({ goals }: { goals: FinancialGoal[] }) {
  const [editing, setEditing] = useState<FinancialGoal | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      const result = editing ? await updateFinancialGoal({}, new FormData(form)) : await createFinancialGoal({}, new FormData(form));
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) { form.reset(); setEditing(null); }
    });
  }

  function archive(goal: FinancialGoal) {
    startTransition(async () => {
      const result = await archiveFinancialGoal(goal.id);
      setFeedback(result.error ?? result.success ?? null);
      if (editing?.id === goal.id) setEditing(null);
    });
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><section className="h-fit min-w-0 rounded-xl border bg-card p-5 shadow-sm"><h2 className="text-lg font-semibold">{editing ? "Editar objetivo" : "Novo objetivo"}</h2><form className="mt-5 grid gap-4" key={editing?.id ?? "new"} onSubmit={submit}>{editing ? <input name="id" type="hidden" value={editing.id} /> : null}<label className="grid gap-1.5 text-sm font-medium">Nome<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.name} maxLength={100} name="name" required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Meta<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing ? currencyInput(editing.targetAmountCents) : ""} inputMode="decimal" name="targetAmount" required /></label><label className="grid gap-1.5 text-sm font-medium">Valor atual<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing ? currencyInput(editing.currentAmountCents) : "0,00"} inputMode="decimal" name="currentAmount" required /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Data alvo<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.targetDate ?? ""} name="targetDate" type="date" /></label><label className="grid gap-1.5 text-sm font-medium">Cor<input className="h-10 w-full rounded-md border bg-background px-3" defaultValue={editing?.color ?? "#16A34A"} name="color" required type="color" /></label></div><div className="flex gap-2"><button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={isPending} type="submit">{editing ? "Salvar" : "Criar objetivo"}</button>{editing ? <button className="h-10 rounded-md border px-4 text-sm" onClick={() => setEditing(null)} type="button">Cancelar</button> : null}</div></form>{feedback ? <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{feedback}</p> : null}</section><section className="overflow-hidden rounded-xl border bg-card shadow-sm"><header className="border-b p-5"><h2 className="text-lg font-semibold">Objetivos ativos</h2></header>{goals.length ? <ul className="divide-y">{goals.map((goal) => { const progress = Math.min(100, (goal.currentAmountCents / goal.targetAmountCents) * 100); return <li className="p-4" key={goal.id}><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{goal.name}</p><p className="mt-1 text-sm text-muted-foreground">{currency(goal.currentAmountCents)} de {currency(goal.targetAmountCents)}</p></div><span className="text-sm font-medium">{progress.toFixed(0)}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ backgroundColor: goal.color, width: `${progress}%` }} /></div><div className="mt-3 flex gap-2"><button className="rounded-md border px-3 py-1.5 text-sm" disabled={isPending} onClick={() => setEditing(goal)} type="button">Editar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600" disabled={isPending} onClick={() => archive(goal)} type="button">Arquivar</button></div></li>; })}</ul> : <p className="p-5 text-sm text-muted-foreground">Nenhum objetivo ativo cadastrado.</p>}</section></div>;
}