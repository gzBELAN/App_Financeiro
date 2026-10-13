"use client";

import { FormEvent, useState, useTransition } from "react";

import { createExpense, deleteExpense, updateExpense } from "@/features/expenses/application/expense-actions";
import { PAYMENT_METHODS, type Expense, type PaymentMethod } from "@/features/expenses/domain/expense";

type CategoryOption = { id: string; name: string };
type ExpenseManagerProperties = { expenses: Expense[]; categories: CategoryOption[] };

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Transferência",
  boleto: "Boleto",
  cash: "Dinheiro",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  other: "Outro",
  pix: "Pix",
};

function centsToInput(amountCents: number) {
  return (amountCents / 100).toFixed(2).replace(".", ",");
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(amountCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export function ExpenseManager({ categories, expenses }: ExpenseManagerProperties) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      const result = await createExpense({}, new FormData(form));
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) form.reset();
    });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateExpense({}, new FormData(event.currentTarget));
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) setEditingExpense(null);
    });
  }

  function remove(expense: Expense) {
    if (!window.confirm(`Excluir a despesa "${expense.description}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const result = await deleteExpense(expense.id);
      setFeedback(result.error ?? result.success ?? null);
    });
  }

  const currentDate = new Date().toISOString().slice(0, 10);

  return <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
    <section className="h-fit rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{editingExpense ? "Editar despesa" : "Nova despesa"}</h2>
      <form className="mt-5 space-y-4" key={editingExpense?.id ?? "new"} onSubmit={editingExpense ? submitEdit : submitCreate}>
        {editingExpense ? <input name="id" type="hidden" value={editingExpense.id} /> : null}
        <label className="grid gap-1.5 text-sm font-medium">Descrição<input className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.description} maxLength={200} name="description" placeholder="Ex.: Mercado semanal" required /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">Valor<input className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense ? centsToInput(editingExpense.amountCents) : ""} inputMode="decimal" name="amount" placeholder="0,00" required /></label>
          <label className="grid gap-1.5 text-sm font-medium">Data<input className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.occurredOn ?? currentDate} name="occurredOn" required type="date" /></label>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">Categoria<select className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.categoryId ?? ""} name="categoryId"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">Pagamento<select className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.paymentMethod ?? "pix"} name="paymentMethod">{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{PAYMENT_METHOD_LABEL[method]}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium">Situação<select className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.status ?? "paid"} name="status"><option value="paid">Pago</option><option value="pending">Pendente</option></select></label>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">Observações<textarea className="min-h-20 rounded-md border bg-background px-3 py-2" defaultValue={editingExpense?.notes ?? ""} maxLength={2000} name="notes" placeholder="Informações adicionais (opcional)" /></label>
        <div className="flex flex-wrap gap-3"><button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "Salvando..." : editingExpense ? "Salvar alterações" : "Registrar despesa"}</button>{editingExpense ? <button className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted" disabled={isPending} onClick={() => setEditingExpense(null)} type="button">Cancelar</button> : null}</div>
      </form>
      {feedback ? <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{feedback}</p> : null}
    </section>
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm"><header className="border-b p-5"><h2 className="text-lg font-semibold">Despesas registradas</h2></header>{expenses.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Nenhuma despesa avulsa registrada.</p> : <ul className="divide-y">{expenses.map((expense) => <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={expense.id}><div className="min-w-0"><div className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: expense.categoryColor ?? "#94A3B8" }} /><p className="truncate font-medium">{expense.description}</p></div><p className="mt-1 text-sm text-muted-foreground">{formatDate(expense.occurredOn)} · {expense.categoryName ?? "Sem categoria"} · {PAYMENT_METHOD_LABEL[expense.paymentMethod]} · {expense.status === "paid" ? "Pago" : "Pendente"}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><strong>{formatCurrency(expense.amountCents)}</strong><div className="flex gap-2"><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" disabled={isPending} onClick={() => setEditingExpense(expense)} type="button">Editar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950" disabled={isPending} onClick={() => remove(expense)} type="button">Excluir</button></div></div></li>)}</ul>}</section>
  </div>;
}