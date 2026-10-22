"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DashboardData, DashboardExpenseDetail } from "@/features/dashboard/domain/dashboard";

const DASHBOARD_CARDS_STORAGE_KEY = "app-financeiro-dashboard-cards";

type CardIdentifier = "monthly-expenses" | "pending";

const DEFAULT_VISIBLE_CARDS: CardIdentifier[] = ["monthly-expenses", "pending"];

type KpiCardProperties = {
  accent?: string;
  description: string;
  label: string;
  value: number;
};

type CardDefinition = KpiCardProperties & {
  id: CardIdentifier;
};

const formatCurrency = (cents: number) => new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(`${value}T00:00:00`));
const tooltipFormatter = (value: number) => formatCurrency(value);

function KpiCard({ label, value, description, accent = "text-foreground", onDetails }: KpiCardProperties & { onDetails?: () => void }) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${accent}`}>{formatCurrency(value)}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      {onDetails ? <button className="mt-3 text-sm font-medium text-primary hover:underline" onClick={onDetails} type="button">Ver detalhes</button> : null}
    </article>
  );
}

function ExpenseDetailsDialog({ items, onClose, title }: { items: DashboardExpenseDetail[]; onClose: () => void; title: string }) {
  return <div aria-labelledby="expense-details-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose} role="dialog"><section className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b p-5"><div><h2 className="text-lg font-semibold" id="expense-details-title">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{items.length} item(ns) que compõem o total.</p></div><button aria-label="Fechar detalhes" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" onClick={onClose} type="button">Fechar</button></header>{items.length ? <ul className="max-h-[55vh] divide-y overflow-y-auto">{items.map((item) => <li className="flex items-center justify-between gap-4 p-4" key={`${item.source}-${item.id}`}><div className="min-w-0"><p className="truncate font-medium">{item.description}</p><p className="mt-1 text-sm text-muted-foreground">{formatDate(item.date)} · {item.source} · {item.status === "paid" ? "Pago" : "Pendente"}</p></div><strong className="shrink-0">{formatCurrency(item.amountCents)}</strong></li>)}</ul> : <p className="p-5 text-sm text-muted-foreground">Não há itens neste total.</p>}</section></div>;
}

function CommitmentDetailsDialog({ items, onClose }: { items: DashboardExpenseDetail[]; onClose: () => void }) {
  const cardGroups = new Map<string, DashboardExpenseDetail[]>();
  const fixedExpenses = items.filter((item) => item.source === "Lançamento");
  items.filter((item) => item.source === "Fatura do cartão").forEach((item) => cardGroups.set(item.cardName ?? "Cartão", [...(cardGroups.get(item.cardName ?? "Cartão") ?? []), item]));
  const renderItems = (groupItems: DashboardExpenseDetail[]) => <ul className="divide-y">{[...groupItems].sort((left, right) => (left.purchaseDate ?? left.date).localeCompare(right.purchaseDate ?? right.date)).map((item) => <li className="flex items-center justify-between gap-4 py-3" key={`${item.source}-${item.id}`}><div className="min-w-0"><p className="truncate font-medium">{item.description}</p><p className="mt-1 text-sm text-muted-foreground">{item.purchaseDate ? `Compra: ${formatDate(item.purchaseDate)} · ` : ""}Vencimento: {formatDate(item.date)}</p></div><strong className="shrink-0">{formatCurrency(item.amountCents)}</strong></li>)}</ul>;
  return <div aria-labelledby="commitment-details-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose} role="dialog"><section className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b p-5"><div><h2 className="text-lg font-semibold" id="commitment-details-title">Compromissos do próximo salário</h2><p className="mt-1 text-sm text-muted-foreground">Faturas em aberto agrupadas por cartão e contas fixas previstas.</p></div><button aria-label="Fechar detalhes" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" onClick={onClose} type="button">Fechar</button></header><div className="max-h-[55vh] space-y-5 overflow-y-auto p-5">{[...cardGroups.entries()].map(([cardName, cardItems]) => <section key={cardName}><div className="flex items-center justify-between gap-4"><h3 className="font-semibold">{cardName}</h3><strong>{formatCurrency(cardItems.reduce((sum, item) => sum + item.amountCents, 0))}</strong></div>{renderItems(cardItems)}</section>)}{fixedExpenses.length ? <section><div className="flex items-center justify-between gap-4"><h3 className="font-semibold">Contas fixas</h3><strong>{formatCurrency(fixedExpenses.reduce((sum, item) => sum + item.amountCents, 0))}</strong></div>{renderItems(fixedExpenses)}</section> : null}{items.length === 0 ? <p className="text-sm text-muted-foreground">Não há compromissos pendentes para o próximo mês.</p> : null}</div></section></div>;
}

function NextSalaryCommitmentCard({ cardInvoiceCents, fixedExpenseCents, onDetails, totalCents }: { cardInvoiceCents: number; fixedExpenseCents: number; onDetails: () => void; totalCents: number }) {
  return <article className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm font-medium text-muted-foreground">Compromissos do próximo salário</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Fatura atualmente em aberto e contas fixas previstas para o próximo mês.</p><dl className="mt-4 space-y-3 text-sm"><div className="flex items-center justify-between gap-4"><dt>Fatura de cartão em aberto</dt><dd className="font-semibold">{formatCurrency(cardInvoiceCents)}</dd></div><div className="flex items-center justify-between gap-4"><dt>Contas fixas do próximo mês</dt><dd className="font-semibold">{formatCurrency(fixedExpenseCents)}</dd></div><div className="flex items-center justify-between gap-4 border-t pt-3 text-base"><dt className="font-semibold">Total já devido</dt><dd className="font-bold text-amber-600">{formatCurrency(totalCents)}</dd></div></dl><button className="mt-4 text-sm font-medium text-primary hover:underline" onClick={onDetails} type="button">Ver detalhes</button></article>;
}

function SalaryPlanningCard({ remainingCents, salaryCents }: { remainingCents: number; salaryCents: number }) {
  return <article className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm font-medium text-muted-foreground">Planejamento do próximo salário</p><dl className="mt-4 space-y-3 text-sm"><div className="flex items-center justify-between gap-4"><dt>Salário planejado</dt><dd className="font-semibold text-primary">{formatCurrency(salaryCents)}</dd></div><div className="flex items-center justify-between gap-4 border-t pt-3 text-base"><dt className="font-semibold">Sobra projetada</dt><dd className={`font-bold ${remainingCents < 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(remainingCents)}</dd></div></dl><p className="mt-3 text-xs leading-5 text-muted-foreground">Salário planejado menos os compromissos já devidos no próximo mês.</p></article>;
}

function EmptyChart() {
  return <div className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground">Ainda não há dados suficientes para esta visualização.</div>;
}

function DashboardCustomization({
  cards,
  onChange,
  visibleCards,
}: {
  cards: CardDefinition[];
  onChange: (cardId: CardIdentifier) => void;
  visibleCards: CardIdentifier[];
}) {
  return (
    <details className="rounded-lg border bg-card px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">Personalizar indicadores</summary>
      <p className="mt-2 text-muted-foreground">Escolha os indicadores exibidos no topo deste painel.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted" key={card.id}>
            <input checked={visibleCards.includes(card.id)} onChange={() => onChange(card.id)} type="checkbox" />
            {card.label}
          </label>
        ))}
      </div>
    </details>
  );
}

export function DashboardView({ data }: { data: DashboardData }) {
  const [details, setDetails] = useState<{ items: DashboardExpenseDetail[]; title: string } | null>(null);
  const [isCommitmentDetailsOpen, setIsCommitmentDetailsOpen] = useState(false);
  const cards = useMemo<CardDefinition[]>(
    () => [
      { description: "Despesas sem cartão pela data do lançamento e cartões pelo vencimento da fatura.", id: "monthly-expenses", label: "Gastos do mês", value: data.monthlyExpenseCents },
      { accent: "text-amber-600", description: "Despesas ainda pendentes dentro do período selecionado.", id: "pending", label: "A pagar no mês", value: data.pendingExpenseCents },
    ],
    [data],
  );
  const [visibleCards, setVisibleCards] = useState<CardIdentifier[]>(DEFAULT_VISIBLE_CARDS);

  useEffect(() => {
    const storedCards = localStorage.getItem(DASHBOARD_CARDS_STORAGE_KEY);
    if (!storedCards) return;

    try {
      const parsedCards = JSON.parse(storedCards) as unknown;
      if (Array.isArray(parsedCards) && parsedCards.every((card) => typeof card === "string")) {
        setVisibleCards(parsedCards.filter((card): card is CardIdentifier => cards.some(({ id }) => id === card)));
      }
    } catch {
      localStorage.removeItem(DASHBOARD_CARDS_STORAGE_KEY);
    }
  }, [cards]);

  function toggleCard(cardId: CardIdentifier) {
    setVisibleCards((currentCards) => {
      const nextCards = currentCards.includes(cardId) ? currentCards.filter((id) => id !== cardId) : [...currentCards, cardId];
      localStorage.setItem(DASHBOARD_CARDS_STORAGE_KEY, JSON.stringify(nextCards));
      return nextCards;
    });
  }

  const selectedCards = cards.filter((card) => visibleCards.includes(card.id));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-lg border bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Planejamento mensal:</span> acompanhe faturas e contas que comprometem o próximo salário.</p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground" href="/expenses">Lançamentos</Link>
          <Link className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted" href="/cards">Contas e cartões</Link>
        </div>
      </section>

      <DashboardCustomization cards={cards} onChange={toggleCard} visibleCards={visibleCards} />

      <section className="grid gap-4 lg:grid-cols-2">
        <SalaryPlanningCard remainingCents={data.salaryRemainingCents} salaryCents={data.monthlySalaryCents} />
        <NextSalaryCommitmentCard cardInvoiceCents={data.nextSalaryCardInvoiceCents} fixedExpenseCents={data.nextSalaryFixedExpenseCents} onDetails={() => setIsCommitmentDetailsOpen(true)} totalCents={data.nextSalaryCommitmentCents} />
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Atenção no período</h2>
          {data.alerts.length ? <ul className="mt-3 space-y-2">{data.alerts.map((alert) => <li className={`rounded-md border px-3 py-2 text-sm ${alert.severity === "critical" ? "border-red-200 bg-red-50 text-red-950 dark:border-red-950 dark:bg-red-950/40 dark:text-red-100" : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-950 dark:bg-amber-950/40 dark:text-amber-100"}`} key={alert.id}><strong>{alert.title}</strong><p className="mt-0.5 text-xs opacity-80">{alert.description}</p></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nenhum alerta financeiro para este período.</p>}
        </article>
      </section>

      {selectedCards.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {selectedCards.map((card) => <KpiCard {...card} key={card.id} onDetails={card.id === "monthly-expenses" ? () => setDetails({ items: data.monthlyExpenseDetails, title: "Detalhes dos gastos do mês" }) : card.id === "pending" ? () => setDetails({ items: data.pendingExpenseDetails, title: "Detalhes do valor a pagar" }) : undefined} />)}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Selecione pelo menos um indicador em “Personalizar indicadores”.
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Evolução mensal</h2>
          <p className="text-sm text-muted-foreground">Receitas e despesas dos últimos seis meses.</p>
          {data.monthlyEvolution.some((item) => item.expenses || item.income) ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={data.monthlyEvolution}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$ ${value / 100}`} width={70} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Line dataKey="expenses" name="Despesas" stroke="#EF4444" strokeWidth={2} type="monotone" />
                  <Line dataKey="income" name="Receitas" stroke="#16A34A" strokeWidth={2} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart />}
        </article>

        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Gastos por categoria</h2>
          <p className="text-sm text-muted-foreground">Distribuição das despesas no mês selecionado.</p>
          {data.categoryBreakdown.length ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie data={data.categoryBreakdown} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} nameKey="name" outerRadius={95}>
                    {data.categoryBreakdown.map((item) => <Cell fill={item.color} key={item.name} />)}
                  </Pie>
                  <Tooltip formatter={tooltipFormatter} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart />}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Gastos por cartão</h2>
          <p className="text-sm text-muted-foreground">Compras e assinaturas incluídas nas faturas com vencimento no mês selecionado.</p>
          {data.cardBreakdown.length ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={data.cardBreakdown} layout="vertical" margin={{ left: 30 }}>
                  <XAxis tickFormatter={(value) => `R$ ${value / 100}`} type="number" />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Bar dataKey="value" name="Gasto">
                    {data.cardBreakdown.map((item) => <Cell fill={item.color} key={item.name} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart />}
        </article>

        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Objetivos financeiros</h2>
          <p className="text-sm text-muted-foreground">Progresso dos seus objetivos ativos.</p>
          <div className="mt-5 space-y-5">
            {data.goals.length ? data.goals.map((goal) => {
              const progress = goal.targetCents ? Math.min(100, (goal.currentCents / goal.targetCents) * 100) : 0;
              return (
                <div key={goal.id}>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ backgroundColor: goal.color, width: `${progress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(goal.currentCents)} de {formatCurrency(goal.targetCents)}</p>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground">Nenhum objetivo ativo cadastrado.</p>}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-lg font-semibold">Lançamentos recentes</h2>
            <p className="text-sm text-muted-foreground">Movimentações do período selecionado.</p>
          </div>
          <Link className="text-sm font-medium text-primary hover:underline" href="/expenses">Ver todos</Link>
        </header>
        {data.recentEntries.length ? (
          <ul className="divide-y">
            {data.recentEntries.map((entry) => (
              <li className="flex items-center justify-between gap-4 p-4" key={entry.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.categoryColor ?? "#94A3B8" }} />
                    <p className="truncate font-medium">{entry.description}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(entry.occurredOn)} · {entry.categoryName ?? "Sem categoria"} · {entry.status === "paid" ? "Pago" : "Pendente"}
                  </p>
                </div>
                <strong>{formatCurrency(entry.amountCents)}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="p-5 text-sm text-muted-foreground">Não há despesas no período selecionado.</p>}
      </section>
      {details ? <ExpenseDetailsDialog items={details.items} onClose={() => setDetails(null)} title={details.title} /> : null}
      {isCommitmentDetailsOpen ? <CommitmentDetailsDialog items={data.nextSalaryCommitmentDetails} onClose={() => setIsCommitmentDetailsOpen(false)} /> : null}
    </div>
  );
}