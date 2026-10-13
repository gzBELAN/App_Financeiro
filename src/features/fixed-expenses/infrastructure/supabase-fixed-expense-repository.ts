import type { CreateFixedExpenseInput, FixedExpense, FixedExpenseRepository } from "@/features/fixed-expenses/domain/fixed-expense";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type RuleRow = {
  id: string; description: string; amount_cents: number; frequency: FixedExpense["frequency"]; billing_day: number; starts_on: string; generate_until: string; payment_method: FixedExpense["paymentMethod"]; is_active: boolean;
  categories: { name: string } | null; financial_entries: { id: string; occurred_on: string; amount_cents: number }[] | null;
};

export class SupabaseFixedExpenseRepository implements FixedExpenseRepository {
  async list(): Promise<FixedExpense[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase.from("recurring_rules").select("id, description, amount_cents, frequency, billing_day, starts_on, generate_until, payment_method, is_active, categories(name), financial_entries(id, occurred_on, amount_cents)").eq("workspace_id", workspace.id).eq("rule_type", "fixed_expense").order("is_active", { ascending: false }).order("description");
    if (error) throw new Error("Não foi possível carregar as contas fixas.");
    return (data as unknown as RuleRow[]).map((rule) => ({ amountCents: rule.amount_cents, billingDay: rule.billing_day, categoryName: rule.categories?.name ?? null, description: rule.description, frequency: rule.frequency, generateUntil: rule.generate_until, id: rule.id, isActive: rule.is_active, paymentMethod: rule.payment_method, startsOn: rule.starts_on, upcomingEntries: (rule.financial_entries ?? []).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on)).map((entry) => ({ amountCents: entry.amount_cents, id: entry.id, occurredOn: entry.occurred_on })) }));
  }

  async create(input: CreateFixedExpenseInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.rpc("create_fixed_expense_rule", { p_amount_cents: input.amountCents, p_billing_day: input.billingDay, p_category_id: input.categoryId || null, p_description: input.description, p_frequency: input.frequency, p_generate_until: input.generateUntil, p_notes: input.notes || null, p_payment_method: input.paymentMethod, p_starts_on: input.startsOn, p_workspace_id: workspace.id });
    if (error) throw new Error("Não foi possível criar a conta fixa. Confirme a função SQL no Supabase e tente novamente.");
  }
}