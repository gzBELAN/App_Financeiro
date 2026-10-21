"use client";

import { useTransition } from "react";

import { deleteFinancialGoal, restoreFinancialGoal } from "@/features/financial-goals/application/financial-goal-actions";
import type { FinancialGoal } from "@/features/financial-goals/domain/financial-goal";
import { FinancialGoalFormManager } from "@/features/financial-goals/presentation/financial-goal-form-manager";

export function FinancialGoalManagerV2({ goals }: { goals: FinancialGoal[] }) {
  const [isPending, startTransition] = useTransition();
  const archived = goals.filter((goal) => goal.isArchived);

  function restore(goal: FinancialGoal) {
    startTransition(async () => {
      const result = await restoreFinancialGoal(goal.id);
      if (result.error) window.alert(result.error);
    });
  }

  function remove(goal: FinancialGoal) {
    if (!window.confirm(`Excluir permanentemente o objetivo "${goal.name}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const result = await deleteFinancialGoal(goal.id);
      window.alert(result.error ?? result.success ?? "");
    });
  }

  return <div className="space-y-8"><FinancialGoalFormManager goals={goals.filter((goal) => !goal.isArchived)} />{archived.length > 0 ? <section className="space-y-4"><header><h2 className="text-xl font-semibold">Objetivos arquivados</h2><p className="mt-1 text-sm text-muted-foreground">Objetivos arquivados ficam fora dos indicadores ativos.</p></header><div className="grid gap-4 sm:grid-cols-2">{archived.map((goal) => <article className="rounded-lg border bg-card p-5 shadow-sm" key={goal.id}><h3 className="font-semibold">{goal.name}</h3><p className="mt-1 text-sm text-muted-foreground">Meta: {new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(goal.targetAmountCents / 100)}</p><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60" disabled={isPending} onClick={() => restore(goal)} type="button">Reativar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60" disabled={isPending} onClick={() => remove(goal)} type="button">Excluir definitivamente</button></div></article>)}</div></section> : null}</div>;
}
