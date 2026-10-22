"use client";

import { FormEvent, useState, useTransition } from "react";

import { advanceInstallments, deleteInstallmentPurchase } from "@/features/installments/application/installment-purchase-actions";
import type { InstallmentPurchase } from "@/features/installments/domain/installment-purchase";

type Option = { id: string; name: string };
const currency = (cents: number) => new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);
const dateLabel = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));

export function InstallmentManagerV2({ purchases }: { categories: Option[]; purchases: InstallmentPurchase[] }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedPurchases, setExpandedPurchases] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const purchasesWithPendingInstallments = purchases.filter((purchase) => purchase.installments.some((installment) => installment.status === "pending"));
  function toggleDetails(id: string) { setExpandedPurchases((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function advance(event: FormEvent<HTMLFormElement>) { event.preventDefault(); startTransition(async () => { const result = await advanceInstallments({}, new FormData(event.currentTarget)); setFeedback(result.error ?? result.success ?? null); }); }
  function remove(purchase: InstallmentPurchase) { if (!window.confirm(`Excluir "${purchase.description}" e todo o histórico de parcelas desta compra? Esta ação não pode ser desfeita.`)) return; startTransition(async () => { const result = await deleteInstallmentPurchase(purchase.id); setFeedback(result.error ?? result.success ?? null); }); }

  return <div className="space-y-6">
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Compras parceladas em aberto</h2>
        <p className="mt-1 text-sm text-muted-foreground">Apenas compras com ao menos uma parcela pendente são exibidas.</p>
      </header>
      {purchasesWithPendingInstallments.length === 0 ? <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Não há compras parceladas com parcelas pendentes.</p> : purchasesWithPendingInstallments.map((purchase) => {
        const pending = purchase.installments.filter((item) => item.status === "pending");
        const installmentAmount = purchase.installments[0]?.amountCents ?? 0;
        const isExpanded = expandedPurchases.has(purchase.id);
        return <article className="rounded-lg border bg-card p-5 shadow-sm" key={purchase.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{purchase.description}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{purchase.creditCardName} · {purchase.installmentCount}x de {currency(installmentAmount)} · Total {currency(purchase.totalAmountCents)} · {pending.length} pendente(s)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button aria-expanded={isExpanded} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" onClick={() => toggleDetails(purchase.id)} type="button">{isExpanded ? "Recolher parcelas" : "Ver parcelas"}</button>
              <button className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950" disabled={isPending} onClick={() => remove(purchase)} type="button">Excluir</button>
            </div>
          </div>
          {isExpanded ? <>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {purchase.installments.map((installment) => <label className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-3 text-sm" key={installment.id}>
                <span><strong>{installment.number}/{installment.count}</strong> · {dateLabel(installment.occurredOn)} · {currency(installment.amountCents)} · {installment.status === "paid" ? "Paga" : installment.status === "pending" ? "Pendente" : "Cancelada"}</span>
                {installment.status === "pending" ? <input aria-label={`Selecionar parcela ${installment.number}`} form={`advance-${purchase.id}`} name="installmentId" type="checkbox" value={installment.id} /> : null}
              </label>)}
            </div>
            <form className="mt-4 flex flex-col gap-3 rounded-md border border-dashed p-4 sm:flex-row sm:items-end" id={`advance-${purchase.id}`} onSubmit={advance}>
              <input name="purchaseId" type="hidden" value={purchase.id} />
              <label className="grid flex-1 gap-1.5 text-sm font-medium">Desconto total (opcional)<input className="h-10 rounded-md border bg-background px-3" inputMode="decimal" name="discount" placeholder="0,00" /></label>
              <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "Salvando..." : "Adiantar selecionadas"}</button>
            </form>
          </> : null}
        </article>;
      })}
    </section>
    {feedback ? <p aria-live="polite" className="text-sm text-muted-foreground">{feedback}</p> : null}
  </div>;
}
