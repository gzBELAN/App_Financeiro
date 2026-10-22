"use client";

import { type FormEvent, useState, useTransition } from "react";

import { archiveCreditCard, createCreditCard, updateCreditCard } from "@/features/credit-cards/application/credit-card-actions";
import type { CreditCard } from "@/features/credit-cards/domain/credit-card";

type AccountOption = { id: string; name: string; bankName: string };
const currencyInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export function CreditCardFormManager({ accounts, cards }: { accounts: AccountOption[]; cards: CreditCard[] }) {
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      const result = editing ? await updateCreditCard({}, new FormData(form)) : await createCreditCard({}, new FormData(form));
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) { form.reset(); setEditing(null); }
    });
  }

  function archive(card: CreditCard) {
    startTransition(async () => {
      const result = await archiveCreditCard(card.id);
      setFeedback(result.error ?? result.success ?? null);
      if (editing?.id === card.id) setEditing(null);
    });
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><section className="h-fit min-w-0 rounded-xl border bg-card p-5 shadow-sm"><h2 className="text-lg font-semibold">{editing ? "Editar cartão" : "Novo cartão"}</h2><form className="mt-5 grid gap-4" key={editing?.id ?? "new"} onSubmit={submit}>{editing ? <input name="id" type="hidden" value={editing.id} /> : null}<label className="grid gap-1.5 text-sm font-medium">Nome<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.name} maxLength={80} name="name" required /></label><label className="grid gap-1.5 text-sm font-medium">Conta bancária<select className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.bankAccountId ?? ""} name="bankAccountId" required><option disabled value="">Selecione uma conta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.bankName} · {account.name}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Bandeira<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.brand} maxLength={40} name="brand" required /></label><label className="grid gap-1.5 text-sm font-medium">Tipo<select className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.cardType ?? "credit"} name="cardType"><option value="credit">Crédito</option><option value="debit">Débito</option><option value="credit_debit">Múltiplo</option></select></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Limite<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing ? currencyInput(editing.creditLimitCents) : ""} inputMode="decimal" name="creditLimit" required /></label><label className="grid gap-1.5 text-sm font-medium">Cor<input className="h-10 w-full rounded-md border bg-background px-3" defaultValue={editing?.color ?? "#2563EB"} name="color" required type="color" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Dias até o fechamento<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.closingDaysBeforeDue ?? 8} max="31" min="1" name="closingDaysBeforeDue" required type="number" /><span className="text-xs font-normal text-muted-foreground">Dias corridos antes do vencimento cadastrado.</span></label><label className="grid gap-1.5 text-sm font-medium">Vencimento<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.dueDay ?? 10} max="31" min="1" name="dueDay" required type="number" /></label></div><div className="flex gap-2"><button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={isPending || !accounts.length} type="submit">{editing ? "Salvar" : "Cadastrar"}</button>{editing ? <button className="h-10 rounded-md border px-4 text-sm" onClick={() => setEditing(null)} type="button">Cancelar</button> : null}</div></form>{feedback ? <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{feedback}</p> : null}</section><section className="overflow-hidden rounded-xl border bg-card shadow-sm"><header className="border-b p-5"><h2 className="text-lg font-semibold">Cartões ativos</h2></header>{cards.length ? <ul className="divide-y">{cards.map((card) => <li className="flex flex-wrap items-center justify-between gap-3 p-4" key={card.id}><div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: card.color }} /><p className="font-medium">{card.name}</p></div><p className="mt-1 text-sm text-muted-foreground">{card.bankName} · {card.brand} · limite {new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(card.creditLimitCents / 100)}</p></div><div className="flex gap-2"><button className="rounded-md border px-3 py-1.5 text-sm" disabled={isPending} onClick={() => setEditing(card)} type="button">Editar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600" disabled={isPending} onClick={() => archive(card)} type="button">Arquivar</button></div></li>)}</ul> : <p className="p-5 text-sm text-muted-foreground">Nenhum cartão ativo cadastrado.</p>}</section></div>;
}