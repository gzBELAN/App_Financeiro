import type { ReportData, ReportFilters, ReportRepository, ReportRow } from "@/features/reports/domain/report";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type EntryRow = { id: string; description: string; occurred_on: string; amount_cents: number; payment_method: string; status: string; recurring_rule_id: string | null; categories: { name: string } | null; credit_cards: { name: string } | null; recurring_rules: { rule_type: "subscription" | "fixed_expense" } | null };
const sourceLabel = (ruleType: EntryRow["recurring_rules"]) => ruleType?.rule_type === "subscription" ? "Assinatura" : ruleType?.rule_type === "fixed_expense" ? "Conta fixa" : "Despesa avulsa";

export class SupabaseReportRepository implements ReportRepository {
  async getData(filters: ReportFilters): Promise<ReportData> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    let query = supabase.from("financial_entries").select("id, description, occurred_on, amount_cents, payment_method, status, recurring_rule_id, categories(name), credit_cards(name), recurring_rules(rule_type)").eq("workspace_id", workspace.id).eq("kind", "expense").neq("status", "cancelled").gte("occurred_on", filters.startsOn).lte("occurred_on", filters.endsOn).order("occurred_on", { ascending: false });
    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.creditCardId) query = query.eq("credit_card_id", filters.creditCardId);
    const { data, error } = await query;
    if (error) throw new Error("Não foi possível carregar o relatório.");
    const rows = (data as unknown as EntryRow[]).filter((entry) => filters.source === "all" || !filters.source || entry.recurring_rules?.rule_type === filters.source).map((entry): ReportRow => ({ amountCents: entry.amount_cents, card: entry.credit_cards?.name ?? "—", category: entry.categories?.name ?? "Sem categoria", date: entry.occurred_on, description: entry.description, id: entry.id, paymentMethod: entry.payment_method, source: sourceLabel(entry.recurring_rules), status: entry.status === "paid" ? "Pago" : "Pendente" }));
    const categoryMap = new Map<string, number>(); const cardMap = new Map<string, number>();
    rows.forEach((row) => { categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) + row.amountCents); if (row.card !== "—") cardMap.set(row.card, (cardMap.get(row.card) ?? 0) + row.amountCents); });
    return { cardTotals: [...cardMap.entries()].map(([name, cents]) => ({ name, cents })).sort((a, b) => b.cents - a.cents), categoryTotals: [...categoryMap.entries()].map(([name, cents]) => ({ name, cents })).sort((a, b) => b.cents - a.cents), paidCents: rows.filter((row) => row.status === "Pago").reduce((sum, row) => sum + row.amountCents, 0), pendingCents: rows.filter((row) => row.status === "Pendente").reduce((sum, row) => sum + row.amountCents, 0), rows, totalCents: rows.reduce((sum, row) => sum + row.amountCents, 0) };
  }
}