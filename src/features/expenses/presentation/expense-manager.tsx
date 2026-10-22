"use client";

import { FormEvent, useState, useTransition } from "react";

import { createExpense, deleteExpense, updateExpense } from "@/features/expenses/application/expense-actions";
import { createInstallmentPurchase } from "@/features/installments/application/installment-purchase-actions";
import { PAYMENT_METHODS, type EntryKind, type Expense, type PaymentMethod } from "@/features/expenses/domain/expense";
import { getLocalIsoDate } from "@/lib/utils/date";

type CategoryOption = { id: string; name: string };
type ExpenseManagerProperties = { expenses: Expense[]; categories: CategoryOption[]; cards: { id: string; name: string }[]; accounts: { id: string; name: string; bankName: string }[] };

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Transferência",
  boleto: "Boleto",
  cash: "Dinheiro",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  other: "Outro",
  pix: "Pix",
};
const ENTRY_KIND_LABEL: Record<EntryKind, string> = { expense: "Despesa", income: "Receita" };

function centsToInput(amountCents: number) {
  return (amountCents / 100).toFixed(2).replace(".", ",");
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(amountCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export function ExpenseManager({ accounts, cards, categories, expenses }: ExpenseManagerProperties) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [entryKind, setEntryKind] = useState<EntryKind>("expense");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      const formData = new FormData(form);
      const installmentCount = Number(formData.get("installmentCount") ?? 1);
      const result = entryKind === "expense" && paymentMethod === "credit_card" && installmentCount > 1
        ? await createInstallmentPurchase({}, formData)
        : await createExpense({}, formData);
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) { form.reset(); setEntryKind("expense"); setPaymentMethod("pix"); }
    });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateExpense({}, new FormData(event.currentTarget));
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) { setEditingExpense(null); setEntryKind("expense"); setPaymentMethod("pix"); }
    });
  }

  function remove(expense: Expense) {
    if (!window.confirm(`Excluir o lançamento "${expense.description}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const result = await deleteExpense(expense.id);
      setFeedback(result.error ?? result.success ?? null);
    });
  }

  const currentDate = getLocalIsoDate();
  const selectedKind = entryKind;
  const selectedPaymentMethod = paymentMethod;

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
    <section className="h-fit min-w-0 rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{editingExpense ? `Editar ${ENTRY_KIND_LABEL[editingExpense.kind].toLowerCase()}` : "Novo lançamento"}</h2>
      <form className="mt-5 space-y-4" key={editingExpense?.id ?? "new"} onSubmit={editingExpense ? submitEdit : submitCreate}>
        {editingExpense ? <input name="id" type="hidden" value={editingExpense.id} /> : null}
        <label className="grid gap-1.5 text-sm font-medium">Tipo<select className="h-10 rounded-md border bg-background px-3" name="kind" onChange={(event) => { const nextKind = event.target.value as EntryKind; setEntryKind(nextKind); if (nextKind === "income") setPaymentMethod("pix"); }} value={selectedKind}><option value="expense">Despesa</option><option value="income">Receita</option></select></label>
        <label className="grid gap-1.5 text-sm font-medium">Descrição<input className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.description} maxLength={200} name="description" placeholder="Ex.: Mercado semanal" required /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">Valor{selectedKind === "expense" && selectedPaymentMethod === "credit_card" ? " total" : ""}<input className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense ? centsToInput(editingExpense.amountCents) : ""} inputMode="decimal" name={selectedKind === "expense" && selectedPaymentMethod === "credit_card" && !editingExpense ? "totalAmount" : "amount"} placeholder="0,00" required /></label>
          <label className="grid gap-1.5 text-sm font-medium">{selectedKind === "expense" && selectedPaymentMethod === "credit_card" ? "Data da compra" : "Data"}<input className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.occurredOn ?? currentDate} name={selectedKind === "expense" && selectedPaymentMethod === "credit_card" && !editingExpense ? "purchaseDate" : "occurredOn"} required type="date" /></label>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">Categoria<select className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.categoryId ?? ""} name="categoryId"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <><label className="grid gap-1.5 text-sm font-medium">Conta bancária<select className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.bankAccountId ?? ""} name="bankAccountId"><option value="">Não associar a uma conta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.bankName} · {account.name}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">Pagamento<select className="h-10 rounded-md border bg-background px-3" name="paymentMethod" onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} value={selectedPaymentMethod}>{PAYMENT_METHODS.filter((method) => selectedKind === "expense" || method !== "credit_card").map((method) => <option key={method} value={method}>{PAYMENT_METHOD_LABEL[method]}</option>)}</select></label>
          {selectedKind === "expense" && selectedPaymentMethod === "credit_card" && !editingExpense ? <input name="status" type="hidden" value="pending" /> : <label className="grid gap-1.5 text-sm font-medium">Situação<select className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.status ?? "paid"} name="status"><option value="paid">Pago</option><option value="pending">Pendente</option></select></label>}
        </div>{selectedKind === "expense" && selectedPaymentMethod === "credit_card" ? <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Cartão<select className="h-10 rounded-md border bg-background px-3" defaultValue={editingExpense?.creditCardId ?? ""} name="creditCardId" required><option disabled value="">Selecione um cartão</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>{!editingExpense ? <label className="grid gap-1.5 text-sm font-medium">Parcelas<input className="h-10 rounded-md border bg-background px-3" defaultValue="1" max="360" min="1" name="installmentCount" required type="number" /></label> : null}</div> : null}{selectedKind === "expense" && selectedPaymentMethod === "credit_card" && !editingExpense ? <p className="text-xs text-muted-foreground">A compra será incluída como pendente na fatura do cartão. Se escolher mais de 1x, cada parcela terá sua própria competência e fatura.</p> : null}</>
        <label className="grid gap-1.5 text-sm font-medium">Observações<textarea className="min-h-20 rounded-md border bg-background px-3 py-2" defaultValue={editingExpense?.notes ?? ""} maxLength={2000} name="notes" placeholder="Informações adicionais (opcional)" /></label>
        <div className="flex flex-wrap gap-3"><button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "Salvando..." : editingExpense ? "Salvar alterações" : "Registrar lançamento"}</button>{editingExpense ? <button className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted" disabled={isPending} onClick={() => { setEditingExpense(null); setEntryKind("expense"); setPaymentMethod("pix"); }} type="button">Cancelar</button> : null}</div>
      </form>
      {feedback ? <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{feedback}</p> : null}
    </section>
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm"><header className="border-b p-5"><h2 className="text-lg font-semibold">Lançamentos registrados</h2></header>{expenses.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Nenhuma receita ou despesa registrada.</p> : <ul className="divide-y">{expenses.map((expense) => <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={expense.id}><div className="min-w-0"><div className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: expense.kind === "income" ? "#16A34A" : expense.categoryColor ?? "#94A3B8" }} /><p className="truncate font-medium">{expense.description}</p></div><p className="mt-1 text-sm text-muted-foreground">{expense.installmentCount ? `Parcela ${expense.installmentNumber}/${expense.installmentCount}` : ENTRY_KIND_LABEL[expense.kind]} · {formatDate(expense.occurredOn)} · {expense.categoryName ?? "Sem categoria"}{expense.bankAccountName ? ` · ${expense.bankAccountName}` : ""} · {PAYMENT_METHOD_LABEL[expense.paymentMethod]} · {expense.status === "paid" ? "Pago" : "Pendente"}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><strong className={expense.kind === "income" ? "text-emerald-600" : ""}>{expense.kind === "income" ? "+" : "-"}{formatCurrency(expense.amountCents)}</strong>{!expense.installmentPurchaseId ? <div className="flex gap-2"><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" disabled={isPending} onClick={() => { setEditingExpense(expense); setEntryKind(expense.kind); setPaymentMethod(expense.paymentMethod); }} type="button">Editar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950" disabled={isPending} onClick={() => remove(expense)} type="button">Excluir</button></div> : <span className="text-xs text-muted-foreground">Gerencie na compra parcelada</span>}</div></li>)}</ul>}</section>
  </div>;
}