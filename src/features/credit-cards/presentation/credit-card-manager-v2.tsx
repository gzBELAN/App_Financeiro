"use client";

import { useTransition } from "react";

import { deleteCreditCard, restoreCreditCard } from "@/features/credit-cards/application/credit-card-actions";
import { CreditCardManager } from "@/features/credit-cards/presentation/credit-card-manager";
import type { CreditCard } from "@/features/credit-cards/domain/credit-card";

export function CreditCardManagerV2({ cards }: { cards: CreditCard[] }) {
  const [isPending, startTransition] = useTransition();
  const archived = cards.filter((card) => !card.isActive);

  function restore(card: CreditCard) {
    startTransition(async () => {
      const result = await restoreCreditCard(card.id);
      if (result.error) window.alert(result.error);
    });
  }

  function remove(card: CreditCard) {
    if (!window.confirm(`Excluir permanentemente o cartão "${card.name}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const result = await deleteCreditCard(card.id);
      window.alert(result.error ?? result.success ?? "");
    });
  }

  return <div className="space-y-8"><CreditCardManager cards={cards.filter((card) => card.isActive)} />{archived.length > 0 ? <section className="space-y-4"><header><h2 className="text-xl font-semibold">Cartões arquivados</h2><p className="mt-1 text-sm text-muted-foreground">Cartões arquivados não podem ser usados em novos lançamentos.</p></header><div className="grid gap-4 sm:grid-cols-2">{archived.map((card) => <article className="rounded-lg border bg-card p-5 shadow-sm" key={card.id}><h3 className="font-semibold">{card.name}</h3><p className="mt-1 text-sm text-muted-foreground">{card.bankName} · {card.brand}</p><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60" disabled={isPending} onClick={() => restore(card)} type="button">Reativar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60" disabled={isPending} onClick={() => remove(card)} type="button">Excluir definitivamente</button></div></article>)}</div></section> : null}</div>;
}
