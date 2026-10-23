import type { DashboardAlert, DashboardData, DashboardExpenseDetail, DashboardFilters, DashboardRepository, MonthlyEvolutionDatum } from "@/features/dashboard/domain/dashboard";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type EntryRow = { id: string; kind: "expense" | "income"; description: string; amount_cents: number; occurred_on: string; status: "pending" | "paid" | "cancelled"; categories: { name: string; color: string } | null; credit_cards: { name: string; color: string } | null; recurring_rules: { rule_type: "fixed_expense" | "subscription" } | null };
type InvoiceItemRow = { entry_id: string; credit_card_id: string; credit_card_name: string; description: string; amount_cents: number; occurred_on: string; purchase_date: string | null; installment_number: number | null; installment_count: number | null; due_date: string; status: "pending" | "paid" };
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
    const nextMonth = monthKey(new Date(Date.UTC(year, month, 1)));
    const { firstDay: nextMonthFirstDay, lastDay: nextMonthLastDay } = monthBounds(nextMonth);
    const historyStart = monthKey(new Date(Date.UTC(year, month - 7, 1)));
    const historyStartDate = `${historyStart}-01`;

    const [entriesResult, invoiceItemsResult, goalsResult, workspaceResult] = await Promise.all([
      supabase.from("financial_entries").select("id, kind, description, amount_cents, occurred_on, status, categories(name, color), credit_cards(name, color), recurring_rules(rule_type)").eq("workspace_id", workspace.id).neq("status", "cancelled").order("occurred_on", { ascending: false }),
      supabase.from("credit_card_invoice_items").select("entry_id, credit_card_id, credit_card_name, description, amount_cents, occurred_on, purchase_date, installment_number, installment_count, due_date, status").eq("workspace_id", workspace.id).gte("due_date", historyStartDate).lte("due_date", nextMonthLastDay),
      supabase.from("financial_goals").select("id, name, current_amount_cents, target_amount_cents, color").eq("workspace_id", workspace.id).eq("is_archived", false).order("created_at", { ascending: false }).limit(4),
      supabase.from("financial_workspaces").select("monthly_salary_cents").eq("id", workspace.id).single(),
    ]);
    if (entriesResult.error) throw new Error("Não foi possível carregar os indicadores financeiros.");
    if (invoiceItemsResult.error) throw new Error("Não foi possível carregar as faturas do período.");
    if (goalsResult.error) throw new Error("Não foi possível carregar os objetivos financeiros.");
    if (workspaceResult.error) throw new Error("Não foi possível carregar o planejamento mensal.");

    const entries = entriesResult.data as unknown as EntryRow[];
    const invoiceItems = invoiceItemsResult.data as unknown as InvoiceItemRow[];
    const currentInvoiceItems = invoiceItems.filter((item) => item.due_date >= firstDay && item.due_date <= lastDay);
    const nextSalaryInvoiceItems = invoiceItems.filter((item) => item.due_date >= nextMonthFirstDay && item.due_date <= nextMonthLastDay);
    const goals = goalsResult.data as GoalRow[];
    const monthExpenses = entries.filter((entry) => entry.kind === "expense" && entry.occurred_on >= firstDay && entry.occurred_on <= lastDay);
    const nonCardMonthExpenses = monthExpenses.filter((entry) => !entry.credit_cards);
    const monthlyExpenseCents = nonCardMonthExpenses.reduce((sum, entry) => sum + entry.amount_cents, 0) + currentInvoiceItems.reduce((sum, item) => sum + item.amount_cents, 0);
    const monthlySalaryCents = Number(workspaceResult.data.monthly_salary_cents ?? 0);
    const pendingExpenseCents = nonCardMonthExpenses.filter((entry) => entry.status === "pending").reduce((sum, entry) => sum + entry.amount_cents, 0) + currentInvoiceItems.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amount_cents, 0);
    const nextMonthFixedExpenses = entries.filter((entry) => entry.kind === "expense" && !entry.credit_cards && entry.recurring_rules?.rule_type === "fixed_expense" && entry.occurred_on >= nextMonthFirstDay && entry.occurred_on <= nextMonthLastDay && entry.status === "pending");
    const nextSalaryCardInvoiceCents = nextSalaryInvoiceItems.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amount_cents, 0);
    const nextSalaryFixedExpenseCents = nextMonthFixedExpenses.reduce((sum, entry) => sum + entry.amount_cents, 0);
    const nextSalaryCommitmentCents = nextSalaryCardInvoiceCents + nextSalaryFixedExpenseCents;
    const entryCategories = new Map(entries.map((entry) => [entry.id, entry.categories?.name ?? "Sem categoria"]));
    const entryCategoryColors = new Map(entries.map((entry) => [entry.id, entry.categories?.color ?? "#94A3B8"]));
    const monthlyExpenseDetails = [
      ...nonCardMonthExpenses.map((entry) => ({ amountCents: entry.amount_cents, categoryName: entry.categories?.name ?? "Sem categoria", date: entry.occurred_on, description: entry.description, id: entry.id, source: "Lançamento" as const, status: entry.status === "paid" ? "paid" as const : "pending" as const })),
      ...currentInvoiceItems.map((item) => ({ amountCents: item.amount_cents, cardName: item.credit_card_name, categoryName: entryCategories.get(item.entry_id) ?? "Sem categoria", date: item.due_date, description: item.description, id: item.entry_id, installmentCount: item.installment_count ?? undefined, installmentNumber: item.installment_number ?? undefined, purchaseDate: item.purchase_date ?? item.occurred_on, source: "Fatura do cartão" as const, status: item.status })),
    ].sort((left, right) => left.date.localeCompare(right.date));
    const pendingExpenseDetails = monthlyExpenseDetails.filter((item) => item.status === "pending");
    const nextSalaryCommitmentDetails: DashboardExpenseDetail[] = [
      ...nextSalaryInvoiceItems.filter((item) => item.status === "pending").map((item) => ({ amountCents: item.amount_cents, cardName: item.credit_card_name, categoryName: entryCategories.get(item.entry_id) ?? "Sem categoria", date: item.due_date, description: item.description, id: item.entry_id, installmentCount: item.installment_count ?? undefined, installmentNumber: item.installment_number ?? undefined, purchaseDate: item.purchase_date ?? item.occurred_on, source: "Fatura do cartão" as const, status: item.status })),
      ...nextMonthFixedExpenses.map((entry) => ({ amountCents: entry.amount_cents, categoryName: entry.categories?.name ?? "Sem categoria", date: entry.occurred_on, description: entry.description, id: entry.id, source: "Lançamento" as const, status: "pending" as const })),
    ];
    nextSalaryCommitmentDetails.sort((left, right) => (right.purchaseDate ?? right.date).localeCompare(left.purchaseDate ?? left.date));
    const alerts: DashboardAlert[] = [];
    if (monthlySalaryCents > 0 && monthlyExpenseCents > monthlySalaryCents) alerts.push({ description: "Os gastos previstos ultrapassam o salário planejado para este mês.", id: "salary-budget", severity: "warning", title: "Orçamento mensal excedido" });
    if (pendingExpenseCents > 0) alerts.push({ description: `${pendingExpenseCents} centavos ainda aguardam pagamento no período selecionado.`, id: "pending-payments", severity: "warning", title: "Pagamentos pendentes" });
    if (monthlySalaryCents > 0 && nextSalaryCommitmentCents > monthlySalaryCents) alerts.push({ description: `O próximo período já possui ${nextSalaryCommitmentCents} centavos comprometidos.`, id: "next-salary-budget", severity: "warning", title: "Próximo salário comprometido" });

    const categoryDetailsMap = new Map<string, { color: string; items: DashboardExpenseDetail[] }>();
    const cardMap = new Map<string, { value: number; color: string }>();
    nextSalaryCommitmentDetails.forEach((item) => {
      const categoryName = item.categoryName ?? "Sem categoria";
      const categoryDetails = categoryDetailsMap.get(categoryName) ?? { color: entryCategoryColors.get(item.id) ?? "#94A3B8", items: [] };
      categoryDetails.items.push(item);
      categoryDetailsMap.set(categoryName, categoryDetails);
    });
    const cardColors = new Map(entries.filter((entry) => entry.credit_cards).map((entry) => [entry.credit_cards!.name, entry.credit_cards!.color]));
    currentInvoiceItems.forEach((item) => {
      const cardCurrent = cardMap.get(item.credit_card_name) ?? { color: cardColors.get(item.credit_card_name) ?? "#94A3B8", value: 0 };
      cardMap.set(item.credit_card_name, { ...cardCurrent, value: cardCurrent.value + item.amount_cents });
    });

    const evolution = new Map<string, MonthlyEvolutionDatum>();
    for (let index = 5; index >= 0; index -= 1) {
      const key = monthKey(new Date(Date.UTC(year, month - 1 - index, 1)));
      evolution.set(key, { expenses: 0, income: 0, month: monthLabel(key) });
    }
    entries.filter((entry) => entry.occurred_on >= historyStartDate && entry.occurred_on <= lastDay && entry.kind === "income").forEach((entry) => {
      const key = entry.occurred_on.slice(0, 7);
      const item = evolution.get(key);
      if (item) item.income += entry.amount_cents;
    });
    entries.filter((entry) => entry.occurred_on >= historyStartDate && entry.occurred_on <= lastDay && entry.kind === "expense" && !entry.credit_cards).forEach((entry) => {
      const key = entry.occurred_on.slice(0, 7);
      const item = evolution.get(key);
      if (item) item.expenses += entry.amount_cents;
    });
    invoiceItems.filter((item) => item.due_date >= historyStartDate && item.due_date <= lastDay).forEach((item) => {
      const key = item.due_date.slice(0, 7);
      const evolutionItem = evolution.get(key);
      if (evolutionItem) evolutionItem.expenses += item.amount_cents;
    });

    return {
      alerts,
      cardBreakdown: [...cardMap.entries()].map(([name, item]) => ({ name, ...item })).sort((a, b) => b.value - a.value),
      categoryBreakdown: [...categoryDetailsMap.entries()].map(([name, group]) => ({ color: group.color, name, value: group.items.reduce((sum, item) => sum + item.amountCents, 0) })).sort((a, b) => b.value - a.value),
      categoryExpenseDetails: [...categoryDetailsMap.entries()].map(([name, group]) => ({ ...group, items: group.items.sort((left, right) => right.date.localeCompare(left.date)), name, totalCents: group.items.reduce((sum, item) => sum + item.amountCents, 0) })).sort((left, right) => right.totalCents - left.totalCents),
      goals: goals.map((goal) => ({ color: goal.color, currentCents: goal.current_amount_cents, id: goal.id, name: goal.name, targetCents: goal.target_amount_cents })),
      monthlyEvolution: [...evolution.values()],
      monthlyExpenseCents,
      monthlyExpenseDetails,
      monthlySalaryCents,
      nextSalaryCardInvoiceCents,
      nextSalaryCommitmentCents,
      nextSalaryCommitmentDetails,
      nextSalaryFixedExpenseCents,
      pendingExpenseCents,
      pendingExpenseDetails,
      salaryRemainingCents: monthlySalaryCents - nextSalaryCommitmentCents,
      recentEntries: monthExpenses.slice(0, 5).map((entry) => ({ amountCents: entry.amount_cents, categoryColor: entry.categories?.color ?? null, categoryName: entry.categories?.name ?? null, description: entry.description, id: entry.id, occurredOn: entry.occurred_on, status: entry.status })),
    };
  }
}