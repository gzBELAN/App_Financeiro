"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DashboardData, DashboardExpenseDetail, DashboardExpenseGroup } from "@/features/dashboard/domain/dashboard";

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
const renderPiePercentageLabel = ({ cx, cy, innerRadius, midAngle, outerRadius, percent }: { cx: number; cy: number; innerRadius: number; midAngle: number; outerRadius: number; percent: number }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
  const angle = (-midAngle * Math.PI) / 180;
  return <text dominantBaseline="central" fill="white" fontSize="12" fontWeight="600" textAnchor="middle" x={cx + radius * Math.cos(angle)} y={cy + radius * Math.sin(angle)}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

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

function CollapsibleDetailGroup({ children, color, items, name, trailingText }: { children: (item: DashboardExpenseDetail) => ReactNode; color?: string; items: DashboardExpenseDetail[]; name: string; trailingText?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const total = items.reduce((sum, item) => sum + item.amountCents, 0);
  return <section className="overflow-hidden rounded-lg border"><button aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60" onClick={() => setIsOpen((current) => !current)} type="button"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color ?? "hsl(var(--primary))" }} /><span className="min-w-0 flex-1 truncate font-semibold">{name}</span><span className="shrink-0 text-right"><strong className="block text-sm">{formatCurrency(total)}</strong>{trailingText ? <span className="text-xs text-muted-foreground">{trailingText}</span> : null}</span>{isOpen ? <ChevronUp aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />}</button>{isOpen ? <ul className="divide-y border-t">{items.map(children)}</ul> : null}</section>;
}

function DetailItem({ item, showPurchaseDetails = false }: { item: DashboardExpenseDetail; showPurchaseDetails?: boolean }) {
  return <li className="flex items-center justify-between gap-4 px-4 py-3" key={`${item.source}-${item.id}`}><div className="min-w-0"><p className="truncate font-medium">{item.description}</p><p className="mt-1 text-sm text-muted-foreground">{showPurchaseDetails && item.purchaseDate ? `Compra: ${formatDate(item.purchaseDate)} · ` : ""}{showPurchaseDetails && item.installmentNumber && item.installmentCount ? `Parcela: ${item.installmentNumber}/${item.installmentCount} · ` : ""}{showPurchaseDetails ? `Vencimento: ${formatDate(item.date)}` : `${formatDate(item.date)} · ${item.source} · ${item.status === "paid" ? "Pago" : "Pendente"}`}</p></div><strong className="shrink-0">{formatCurrency(item.amountCents)}</strong></li>;
}

function ExpenseDetailsDialog({ items, onClose, title }: { items: DashboardExpenseDetail[]; onClose: () => void; title: string }) {
  const cardGroups = new Map<string, DashboardExpenseDetail[]>();
  const fixedExpenses = items.filter((item) => item.source === "Lançamento");
  items.filter((item) => item.source === "Fatura do cartão").forEach((item) => cardGroups.set(item.cardName ?? "Cartão", [...(cardGroups.get(item.cardName ?? "Cartão") ?? []), item]));
  return <div aria-labelledby="expense-details-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose} role="dialog"><section className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b p-5"><div><h2 className="text-lg font-semibold" id="expense-details-title">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{items.length} item(ns) que compõem o total.</p></div><button aria-label="Fechar detalhes" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" onClick={onClose} type="button">Fechar</button></header>{items.length ? <div className="max-h-[55vh] space-y-3 overflow-y-auto p-5">{[...cardGroups.entries()].map(([name, groupItems]) => <CollapsibleDetailGroup items={groupItems} key={name} name={name}>{(item) => <DetailItem item={item} key={`${item.source}-${item.id}`} showPurchaseDetails />}</CollapsibleDetailGroup>)}{fixedExpenses.length ? <CollapsibleDetailGroup items={fixedExpenses} name="Lançamentos e contas">{(item) => <DetailItem item={item} key={`${item.source}-${item.id}`} />}</CollapsibleDetailGroup> : null}</div> : <p className="p-5 text-sm text-muted-foreground">Não há itens neste total.</p>}</section></div>;
}

function CategoryDetailsDialog({ groups, onClose, totalCents }: { groups: DashboardExpenseGroup[]; onClose: () => void; totalCents: number }) {
  return <div aria-labelledby="category-details-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose} role="dialog"><section className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b p-5"><div><h2 className="text-lg font-semibold" id="category-details-title">Detalhes por categoria</h2><p className="mt-1 text-sm text-muted-foreground">Saídas já previstas para o próximo salário.</p></div><button aria-label="Fechar detalhes" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" onClick={onClose} type="button">Fechar</button></header><div className="border-b bg-muted/40 px-5 py-3 text-sm"><span className="text-muted-foreground">Total previsto</span><strong className="ml-2">{formatCurrency(totalCents)}</strong></div><div className="max-h-[55vh] space-y-3 overflow-y-auto p-5">{groups.map((group) => <CollapsibleDetailGroup color={group.color} items={group.items} key={group.name} name={group.name} trailingText={`${totalCents ? ((group.totalCents / totalCents) * 100).toFixed(0) : 0}%`}>{(item) => <DetailItem item={item} key={`${item.source}-${item.id}`} showPurchaseDetails /></CollapsibleDetailGroup>)}</div></section></div>;
}

function CommitmentDetailsDialog({ items, onClose }: { items: DashboardExpenseDetail[]; onClose: () => void }) {
  const cardGroups = new Map<string, DashboardExpenseDetail[]>();
  const fixedExpenses = items.filter((item) => item.source === "Lançamento");
  items.filter((item) => item.source === "Fatura do cartão").forEach((item) => cardGroups.set(item.cardName ?? "Cartão", [...(cardGroups.get(item.cardName ?? "Cartão") ?? []), item]));
  const sortedItems = (groupItems: DashboardExpenseDetail[]) => [...groupItems].sort((left, right) => (right.purchaseDate ?? right.date).localeCompare(left.purchaseDate ?? left.date));
  return <div aria-labelledby="commitment-details-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose} role="dialog"><section className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b p-5"><div><h2 className="text-lg font-semibold" id="commitment-details-title">Compromissos do próximo salário</h2><p className="mt-1 text-sm text-muted-foreground">Faturas em aberto agrupadas por cartão e contas fixas previstas.</p></div><button aria-label="Fechar detalhes" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" onClick={onClose} type="button">Fechar</button></header><div className="max-h-[55vh] space-y-3 overflow-y-auto p-5">{[...cardGroups.entries()].map(([cardName, cardItems]) => <CollapsibleDetailGroup items={sortedItems(cardItems)} key={cardName} name={cardName}>{(item) => <DetailItem item={item} key={`${item.source}-${item.id}`} showPurchaseDetails />}</CollapsibleDetailGroup>)}{fixedExpenses.length ? <CollapsibleDetailGroup items={sortedItems(fixedExpenses)} name="Contas fixas">{(item) => <DetailItem item={item} key={`${item.source}-${item.id}`} showPurchaseDetails />}</CollapsibleDetailGroup> : null}{items.length === 0 ? <p className="text-sm text-muted-foreground">Não há compromissos pendentes para o próximo mês.</p> : null}</div></section></div>;
}

function NextSalarySummaryCard({ cardInvoiceCents, fixedExpenseCents, onDetails, remainingCents, salaryCents, totalCents }: { cardInvoiceCents: number; fixedExpenseCents: number; onDetails: () => void; remainingCents: number; salaryCents: number; totalCents: number }) {
  const isNegative = remainingCents < 0;
  const commitmentPercentage = salaryCents > 0 ? Math.min(100, Math.round((totalCents / salaryCents) * 100)) : 0;

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="bg-gradient-to-br from-primary to-cyan-700 p-5 text-primary-foreground sm:p-6">
        <p className="text-sm font-medium text-primary-foreground/80">Resumo do próximo salário</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm text-primary-foreground/80">Sobra projetada</p>
            <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{formatCurrency(remainingCents)}</p>
            <p className="mt-2 text-xs leading-5 text-primary-foreground/80">Após pagar os compromissos já previstos.</p>
          </div>
          <div className="rounded-xl bg-black/10 px-4 py-3 text-sm backdrop-blur-sm">
            <p className="text-primary-foreground/75">Salário previsto</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(salaryCents)}</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Saídas já previstas</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600">{formatCurrency(totalCents)}</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{commitmentPercentage}% do salário</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Percentual do salário comprometido" aria-valuemax={100} aria-valuemin={0} aria-valuenow={commitmentPercentage}>
          <div className={`h-full rounded-full ${isNegative ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${commitmentPercentage}%` }} />
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/60 p-3"><dt className="text-muted-foreground">Fatura de cartão</dt><dd className="mt-1 font-semibold">{formatCurrency(cardInvoiceCents)}</dd></div>
          <div className="rounded-lg bg-muted/60 p-3"><dt className="text-muted-foreground">Contas fixas</dt><dd className="mt-1 font-semibold">{formatCurrency(fixedExpenseCents)}</dd></div>
        </dl>
        <button className="mt-5 text-sm font-medium text-primary hover:underline" onClick={onDetails} type="button">Ver detalhes dos compromissos</button>
      </div>
    </article>
  );
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
  const [isCategoryDetailsOpen, setIsCategoryDetailsOpen] = useState(false);
  const cards = useMemo<CardDefinition[]>(
    () => [
      { description: "Despesas consolidadas no período selecionado, agrupadas por cartão e lançamentos.", id: "monthly-expenses", label: "Gastos do período fechado", value: data.monthlyExpenseCents },
      { accent: "text-amber-600", description: "Despesas que continuam pendentes no período selecionado.", id: "pending", label: "Contas em aberto", value: data.pendingExpenseCents },
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
      <NextSalarySummaryCard cardInvoiceCents={data.nextSalaryCardInvoiceCents} fixedExpenseCents={data.nextSalaryFixedExpenseCents} onDetails={() => setIsCommitmentDetailsOpen(true)} remainingCents={data.salaryRemainingCents} salaryCents={data.monthlySalaryCents} totalCents={data.nextSalaryCommitmentCents} />

      <section className="flex flex-col gap-3 rounded-lg border bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Planejamento mensal:</span> acompanhe faturas e contas que comprometem o próximo salário.</p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground" href="/expenses">Lançamentos</Link>
          <Link className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted" href="/cards">Contas e cartões</Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Atenção no período</h2>
          {data.alerts.length ? <ul className="mt-3 space-y-2">{data.alerts.map((alert) => <li className={`rounded-md border px-3 py-2 text-sm ${alert.severity === "critical" ? "border-red-200 bg-red-50 text-red-950 dark:border-red-950 dark:bg-red-950/40 dark:text-red-100" : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-950 dark:bg-amber-950/40 dark:text-amber-100"}`} key={alert.id}><strong>{alert.title}</strong><p className="mt-0.5 text-xs opacity-80">{alert.description}</p></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Nenhum alerta financeiro para este período.</p>}
        </article>
      </section>

      <DashboardCustomization cards={cards} onChange={toggleCard} visibleCards={visibleCards} />

      {selectedCards.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {selectedCards.map((card) => <KpiCard {...card} key={card.id} onDetails={card.id === "monthly-expenses" ? () => setDetails({ items: data.monthlyExpenseDetails, title: "Gastos do período fechado" }) : card.id === "pending" ? () => setDetails({ items: data.pendingExpenseDetails, title: "Contas em aberto" }) : undefined} />)}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Selecione pelo menos um indicador em “Personalizar indicadores”.
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Evolução mensal</h2>
          <p className="text-sm text-muted-foreground">Receitas e despesas dos últimos seis meses; cartões entram no mês de vencimento da fatura.</p>
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
          <p className="text-sm text-muted-foreground">Distribuição das saídas já previstas para o próximo salário.</p>
          {data.categoryBreakdown.length ? (
            <>
            <div className="mt-5 h-72 overflow-hidden">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart margin={{ bottom: 12, left: 0, right: 0, top: 12 }}>
                  <Pie data={data.categoryBreakdown} dataKey="value" label={renderPiePercentageLabel} labelLine={false} nameKey="name" outerRadius="72%">
                    {data.categoryBreakdown.map((item) => <Cell fill={item.color} key={item.name} />)}
                  </Pie>
                  <Tooltip formatter={tooltipFormatter} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <button className="mt-2 text-sm font-medium text-primary hover:underline" onClick={() => setIsCategoryDetailsOpen(true)} type="button">Ver detalhes por categoria</button>
            </>
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
      {isCategoryDetailsOpen ? <CategoryDetailsDialog groups={data.categoryExpenseDetails} onClose={() => setIsCategoryDetailsOpen(false)} totalCents={data.nextSalaryCommitmentCents} /> : null}
    </div>
  );
}