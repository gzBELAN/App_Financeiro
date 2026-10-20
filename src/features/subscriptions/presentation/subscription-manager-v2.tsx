"use client";

import { FormEvent, useState, useTransition } from "react";

import { createSubscription, deactivateSubscription, deleteSubscription, reactivateSubscription, updateSubscription } from "@/features/subscriptions/application/subscription-actions";
import type { RecurrenceFrequency, Subscription } from "@/features/subscriptions/domain/subscription";

type Option = { id: string; name: string };
type EditingSubscription = Subscription;
const frequencies: { value: RecurrenceFrequency; label: string }[] = [{ value: "monthly", label: "Mensal" }, { value: "quarterly", label: "Trimestral" }, { value: "semiannual", label: "Semestral" }, { value: "annual", label: "Anual" }];
const currency = (cents: number) => new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);
const inputAmount = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export function SubscriptionManagerV2({ cards, categories, subscriptions }: { cards: Option[]; categories: Option[]; subscriptions: Subscription[] }) {
  const [editing, setEditing] = useState<EditingSubscription | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = `${new Date().getFullYear() + 1}-12-31`;
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.isActive);
  const completedSubscriptions = subscriptions.filter((subscription) => !subscription.isActive);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      const result = editing ? await updateSubscription({}, new FormData(form)) : await createSubscription({}, new FormData(form));
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) { form.reset(); setEditing(null); }
    });
  }

  function deactivate(subscription: Subscription) {
    if (!window.confirm(`Encerrar "${subscription.description}"? Os lançamentos pendentes futuros serão removidos, mas o histórico será mantido.`)) return;
    startTransition(async () => {
      const result = await deactivateSubscription(subscription.id);
      setFeedback(result.error ?? result.success ?? null);
      if (editing?.id === subscription.id) setEditing(null);
    });
  }

  function reactivate(subscription: Subscription) { startTransition(async () => { const result = await reactivateSubscription(subscription.id); setFeedback(result.error ?? result.success ?? null); }); }
  function remove(subscription: Subscription) { if (!window.confirm(`Excluir permanentemente "${subscription.description}"? Isso só é permitido quando não há pagamentos no histórico.`)) return; startTransition(async () => { const result = await deleteSubscription(subscription.id); setFeedback(result.error ?? result.success ?? null); }); }

  return <div className="space-y-6">
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{editing ? "Editar assinatura" : "Nova assinatura"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{editing ? "Ao salvar, apenas as previsões pendentes futuras serão recalculadas." : "Serão projetados lançamentos até a data final informada."}</p>
      <form className="mt-5 grid gap-4 md:grid-cols-2" key={editing?.id ?? "new"} onSubmit={submit}>
        {editing ? <input name="id" type="hidden" value={editing.id} /> : null}
        <label className="grid gap-1.5 text-sm font-medium md:col-span-2">Descrição<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.description} maxLength={200} name="description" required /></label>
        <label className="grid gap-1.5 text-sm font-medium">Valor<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing ? inputAmount(editing.amountCents) : ""} inputMode="decimal" name="amount" required /></label>
        <label className="grid gap-1.5 text-sm font-medium">Frequência<select className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.frequency ?? "monthly"} name="frequency">{frequencies.map((frequency) => <option key={frequency.value} value={frequency.value}>{frequency.label}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm font-medium">Dia de cobrança<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.billingDay ?? 1} max="31" min="1" name="billingDay" required type="number" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Cartão<select className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.creditCardId ?? ""} name="creditCardId"><option value="">Outro meio de pagamento</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm font-medium">Categoria<select className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.categoryId ?? ""} name="categoryId"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm font-medium">Início<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.startsOn ?? today} name="startsOn" required type="date" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Prever até<input className="h-10 rounded-md border bg-background px-3" defaultValue={editing?.generateUntil ?? nextYear} name="generateUntil" required type="date" /></label>
        <label className="grid gap-1.5 text-sm font-medium md:col-span-2">Observações<textarea className="min-h-20 rounded-md border bg-background px-3 py-2" name="notes" /></label>
        <div className="flex gap-3 md:col-span-2"><button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "Salvando..." : editing ? "Salvar alterações" : "Criar assinatura"}</button>{editing ? <button className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted" onClick={() => setEditing(null)} type="button">Cancelar</button> : null}</div>
      </form>
      {feedback ? <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{feedback}</p> : null}
    </section>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Assinaturas ativas</h2>{activeSubscriptions.length === 0 ? <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Nenhuma assinatura ativa.</p> : activeSubscriptions.map((subscription) => <article className="rounded-lg border bg-card p-5 shadow-sm" key={subscription.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{subscription.description}</h3><p className="mt-1 text-sm text-muted-foreground">{currency(subscription.amountCents)} · Ativa</p></div><div className="flex gap-2"><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" disabled={isPending} onClick={() => setEditing(subscription)} type="button">Editar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" disabled={isPending} onClick={() => deactivate(subscription)} type="button">Encerrar</button></div></div></article>)}</section>
    {completedSubscriptions.length > 0 ? <section className="space-y-4"><header><h2 className="text-xl font-semibold">Assinaturas encerradas</h2><p className="mt-1 text-sm text-muted-foreground">Histórico preservado; não há novas cobranças projetadas.</p></header>{completedSubscriptions.map((subscription) => <article className="rounded-lg border bg-card p-5 opacity-80 shadow-sm" key={subscription.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{subscription.description}</h3><p className="mt-1 text-sm text-muted-foreground">{currency(subscription.amountCents)} · Encerrada</p></div><div className="flex gap-2"><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" disabled={isPending} onClick={() => reactivate(subscription)} type="button">Reativar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" disabled={isPending} onClick={() => remove(subscription)} type="button">Excluir definitivamente</button></div></div></article>)}</section> : null}
  </div>;
}
