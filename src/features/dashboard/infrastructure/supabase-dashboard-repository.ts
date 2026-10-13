import type { DashboardData, DashboardFilters, DashboardRepository, MonthlyEvolutionDatum } from "@/features/dashboard/domain/dashboard";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type EntryRow = { id: string; kind: "expense" | "income"; description: string; amount_cents: number; occurred_on: string; status: "pending" | "paid" | "cancelled"; categories: { name: string; color: string } | null; credit_cards: { name: string; color: string } | null };
type GoalRow = { id: string; name: string; current_amount_cents: number; target_amount_cents: number; color: string };

function monthBounds(referenceMonth: string) {
  const [year, month] = referenceMonth.split("-").map(Number);
  const firstDay = `${referenceMonth}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { firstDay, lastDay, year, month };
}

function monthKey(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function monthLabel(key: string) { return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${key}-01T00:00:00Z")).replace(".", ""); }

export class SupabaseDashboardRepository implements DashboardRepository {
  async getData(filters: DashboardFilters): Promise<DashboardData> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { firstDay, lastDay, year, month } = monthBounds(filters.referenceMonth);
    const historyStart = monthKey(new Date(Date.UTC(year, month - 7, 1)));
    const historyStartDate = `${historyStart}-01`;

    const [entriesResult, goalsResult] = await Promise.all([
      supabase.from("financial_entries").select("id, kind, description, amount_cents, occurred_on, status, categories(name, color), credit_cards(name, color)").eq("workspace_id", workspace.id).neq("status", "cancelled").order("occurred_on", { ascending: false }),
      supabase.from("financial_goals").select("id, name, current_amount_cents, target_amount_cents, color").eq("workspace_id", workspace.id).eq("is_archived", false).order("created_at", { ascending: false }).limit(4),
    ]);
    if (entriesResult.error) throw new Error("Não foi possível carregar os indicadores financeiros.");
    if (goalsResult.error) throw new Error("Não foi possível carregar os objetivos financeiros.");

    const entries = entriesResult.data as unknown as EntryRow[];
    const goals = goalsResult.data as GoalRow[];
    const paidEntriesUntilPeriod = entries.filter((entry) => entry.status === "paid" && entry.occurred_on <= lastDay);
    const balanceCents = paidEntriesUntilPeriod.reduce((sum, entry) => sum + (entry.kind === "income" ? entry.amount_cents : -entry.amount_cents), 0);
    const monthExpenses = entries.filter((entry) => entry.kind === "expense" && entry.occurred_on >= firstDay && entry.occurred_on <= lastDay);
    const monthlyExpenseCents = monthExpenses.reduce((sum, entry) => sum + entry.amount_cents, 0);
    const futureEntries = entries.filter((entry) => entry.kind === "expense" && entry.occurred_on > lastDay);
    const futureExpenseCents = futureEntries.reduce((sum, entry) => sum + entry.amount_cents, 0);
    const pendingExpenseCents = monthExpenses.filter((entry) => entry.status === "pending").reduce((sum, entry) => sum + entry.amount_cents, 0);

    const categoryMap = new Map<string, { value: number; color: string }>();
    const cardMap = new Map<string, { value: number; color: string }>();
    monthExpenses.forEach((entry) => {
      const categoryName = entry.categories?.name ?? "Sem categoria";
      const categoryCurrent = categoryMap.get(categoryName) ?? { color: entry.categories?.color ?? "#94A3B8", value: 0 };
      categoryMap.set(categoryName, { ...categoryCurrent, value: categoryCurrent.value + entry.amount_cents });
      if (entry.credit_cards) {
        const cardCurrent = cardMap.get(entry.credit_cards.name) ?? { color: entry.credit_cards.color, value: 0 };
        cardMap.set(entry.credit_cards.name, { ...cardCurrent, value: cardCurrent.value + entry.amount_cents });
      }
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
      balanceCents,
      cardBreakdown: [...cardMap.entries()].map(([name, item]) => ({ name, ...item })).sort((a, b) => b.value - a.value),
      categoryBreakdown: [...categoryMap.entries()].map(([name, item]) => ({ name, ...item })).sort((a, b) => b.value - a.value),
      futureExpenseCents,
      goals: goals.map((goal) => ({ color: goal.color, currentCents: goal.current_amount_cents, id: goal.id, name: goal.name, targetCents: goal.target_amount_cents })),
      monthlyEvolution: [...evolution.values()],
      monthlyExpenseCents,
      pendingExpenseCents,
      recentEntries: monthExpenses.slice(0, 5).map((entry) => ({ amountCents: entry.amount_cents, categoryColor: entry.categories?.color ?? null, categoryName: entry.categories?.name ?? null, description: entry.description, id: entry.id, occurredOn: entry.occurred_on, status: entry.status })),
    };
  }
}