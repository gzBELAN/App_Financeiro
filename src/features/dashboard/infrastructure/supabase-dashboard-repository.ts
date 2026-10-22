import type { DashboardAlert, DashboardData, DashboardFilters, DashboardRepository, MonthlyEvolutionDatum } from "@/features/dashboard/domain/dashboard";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type EntryRow = { id: string; kind: "expense" | "income"; description: string; amount_cents: number; occurred_on: string; status: "pending" | "paid" | "cancelled"; categories: { name: string; color: string } | null; credit_cards: { name: string; color: string } | null };
type InvoiceItemRow = { credit_card_id: string; credit_card_name: string; amount_cents: number; due_date: string; status: "pending" | "paid" };
type GoalRow = { id: string; name: string; current_amount_cents: number; target_amount_cents: number; color: string };

function monthBounds(referenceMonth: string) {
  const [year, month] = referenceMonth.split("-").map(Number);
  const firstDay = `${referenceMonth}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { firstDay, lastDay, year, month };
}

function monthKey(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function monthLabel(key: string) { return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${key}-01T00:00:00Z`)).replace(".", ""); }

export class SupabaseDashboardRepository implements DashboardRepository {
  async getData(filters: DashboardFilters): Promise<DashboardData> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { firstDay, lastDay, year, month } = monthBounds(filters.referenceMonth);
    const historyStart = monthKey(new Date(Date.UTC(year, month - 7, 1)));
    const historyStartDate = `${historyStart}-01`;

    const [entriesResult, invoiceItemsResult, goalsResult, workspaceResult] = await Promise.all([
      supabase.from("financial_entries").select("id, kind, description, amount_cents, occurred_on, status, categories(name, color), credit_cards(name, color)").eq("workspace_id", workspace.id).neq("status", "cancelled").order("occurred_on", { ascending: false }),
      supabase.from("credit_card_invoice_items").select("credit_card_id, credit_card_name, amount_cents, due_date, status").eq("workspace_id", workspace.id).gte("due_date", firstDay).lte("due_date", lastDay),
      supabase.from("financial_goals").select("id, name, current_amount_cents, target_amount_cents, color").eq("workspace_id", workspace.id).eq("is_archived", false).order("created_at", { ascending: false }).limit(4),
      supabase.from("financial_workspaces").select("monthly_salary_cents").eq("id", workspace.id).single(),
    ]);
    if (entriesResult.error) throw new Error("Não foi possível carregar os indicadores financeiros.");
    if (invoiceItemsResult.error) throw new Error("Não foi possível carregar as faturas do período.");
    if (goalsResult.error) throw new Error("Não foi possível carregar os objetivos financeiros.");
    if (workspaceResult.error) throw new Error("Não foi possível carregar o planejamento mensal.");

    const entries = entriesResult.data as unknown as EntryRow[];
    const invoiceItems = invoiceItemsResult.data as unknown as InvoiceItemRow[];
    const goals = goalsResult.data as GoalRow[];
    const paidEntriesUntilPeriod = entries.filter((entry) => entry.status === "paid" && entry.occurred_on <= lastDay);
    const balanceCents = paidEntriesUntilPeriod.reduce((sum, entry) => sum + (entry.kind === "income" ? entry.amount_cents : -entry.amount_cents), 0);
    const monthExpenses = entries.filter((entry) => entry.kind === "expense" && entry.occurred_on >= firstDay && entry.occurred_on <= lastDay);
    const nonCardMonthExpenses = monthExpenses.filter((entry) => !entry.credit_cards);
    const monthlyExpenseCents = nonCardMonthExpenses.reduce((sum, entry) => sum + entry.amount_cents, 0) + invoiceItems.reduce((sum, item) => sum + item.amount_cents, 0);
    const monthlySalaryCents = Number(workspaceResult.data.monthly_salary_cents ?? 0);
    const futureEntries = entries.filter((entry) => entry.kind === "expense" && entry.occurred_on > lastDay);
    const futureExpenseCents = futureEntries.reduce((sum, entry) => sum + entry.amount_cents, 0);
    const pendingExpenseCents = nonCardMonthExpenses.filter((entry) => entry.status === "pending").reduce((sum, entry) => sum + entry.amount_cents, 0) + invoiceItems.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amount_cents, 0);
    const projectedPeriodEndCents = balanceCents - pendingExpenseCents;
    const alerts: DashboardAlert[] = [];
    if (projectedPeriodEndCents < 0) alerts.push({ description: `Após pagar os lançamentos pendentes, a projeção é ${Math.abs(projectedPeriodEndCents)} centavos negativa.`, id: "negative-projection", severity: "critical", title: "Projeção de caixa negativa" });
    if (monthlySalaryCents > 0 && monthlyExpenseCents > monthlySalaryCents) alerts.push({ description: "Os gastos previstos ultrapassam o salário planejado para este mês.", id: "salary-budget", severity: "warning", title: "Orçamento mensal excedido" });
    if (pendingExpenseCents > 0) alerts.push({ description: `${pendingExpenseCents} centavos ainda aguardam pagamento no período selecionado.`, id: "pending-payments", severity: "warning", title: "Pagamentos pendentes" });

    const categoryMap = new Map<string, { value: number; color: string }>();
    const cardMap = new Map<string, { value: number; color: string }>();
    monthExpenses.forEach((entry) => {
      const categoryName = entry.categories?.name ?? "Sem categoria";
      const categoryCurrent = categoryMap.get(categoryName) ?? { color: entry.categories?.color ?? "#94A3B8", value: 0 };
      categoryMap.set(categoryName, { ...categoryCurrent, value: categoryCurrent.value + entry.amount_cents });
    });
    const cardColors = new Map(entries.filter((entry) => entry.credit_cards).map((entry) => [entry.credit_cards!.name, entry.credit_cards!.color]));
    invoiceItems.forEach((item) => {
      const cardCurrent = cardMap.get(item.credit_card_name) ?? { color: cardColors.get(item.credit_card_name) ?? "#94A3B8", value: 0 };
      cardMap.set(item.credit_card_name, { ...cardCurrent, value: cardCurrent.value + item.amount_cents });
    });

    const evolution = new Map<string, MonthlyEvolutionDatum>();
    for (let index = 5; index >= 0; index -= 1) {
      const key = monthKey(new Date(Date.UTC(year, month - 1 - index, 1)));
      evolution.set(key, { expenses: 0, income: 0, month: monthLabel(key) });
    }
    entries.filter((entry) => entry.occurred_on >= historyStartDate && entry.occurred_on <= lastDay).forEach((entry) => {
      const key = entry.occurred_on.slice(0, 7);
      const item = evolution.get(key);
      if (item) item[entry.kind === "income" ? "income" : "expenses"] += entry.amount_cents;
    });

    return {
      alerts,
      balanceCents,
      cardBreakdown: [...cardMap.entries()].map(([name, item]) => ({ name, ...item })).sort((a, b) => b.value - a.value),
      categoryBreakdown: [...categoryMap.entries()].map(([name, item]) => ({ name, ...item })).sort((a, b) => b.value - a.value),
      futureExpenseCents,
      goals: goals.map((goal) => ({ color: goal.color, currentCents: goal.current_amount_cents, id: goal.id, name: goal.name, targetCents: goal.target_amount_cents })),
      monthlyEvolution: [...evolution.values()],
      monthlyExpenseCents,
      monthlySalaryCents,
      pendingExpenseCents,
      projectedPeriodEndCents,
      salaryRemainingCents: monthlySalaryCents - monthlyExpenseCents,
      recentEntries: monthExpenses.slice(0, 5).map((entry) => ({ amountCents: entry.amount_cents, categoryColor: entry.categories?.color ?? null, categoryName: entry.categories?.name ?? null, description: entry.description, id: entry.id, occurredOn: entry.occurred_on, status: entry.status })),
    };
  }
}