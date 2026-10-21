import type { CreateSubscriptionInput, Subscription, SubscriptionRepository } from "@/features/subscriptions/domain/subscription";
import { createClient } from "@/lib/supabase/server";
import { getLocalIsoDate } from "@/lib/utils/date";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type RuleRow = {
  id: string; description: string; amount_cents: number; frequency: Subscription["frequency"]; billing_day: number; starts_on: string; generate_until: string; is_active: boolean; category_id: string | null; credit_card_id: string | null;
  credit_cards: { name: string } | null; categories: { name: string } | null;
  financial_entries: { id: string; occurred_on: string; amount_cents: number }[] | null;
};

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  async list(): Promise<Subscription[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase.from("recurring_rules").select("id, description, amount_cents, frequency, billing_day, starts_on, generate_until, is_active, category_id, credit_card_id, credit_cards(name), categories(name), financial_entries(id, occurred_on, amount_cents)").eq("workspace_id", workspace.id).eq("rule_type", "subscription").order("is_active", { ascending: false }).order("description");
    if (error) throw new Error("Não foi possível carregar as assinaturas.");
    return (data as unknown as RuleRow[]).map((rule) => ({ amountCents: rule.amount_cents, billingDay: rule.billing_day, categoryId: rule.category_id, categoryName: rule.categories?.name ?? null, creditCardId: rule.credit_card_id, creditCardName: rule.credit_cards?.name ?? null, description: rule.description, frequency: rule.frequency, generateUntil: rule.generate_until, id: rule.id, isActive: rule.is_active, startsOn: rule.starts_on, upcomingEntries: (rule.financial_entries ?? []).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on)).map((entry) => ({ amountCents: entry.amount_cents, id: entry.id, occurredOn: entry.occurred_on })) }));
  }

  async create(input: CreateSubscriptionInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.rpc("create_subscription_rule", { p_amount_cents: input.amountCents, p_billing_day: input.billingDay, p_category_id: input.categoryId || null, p_credit_card_id: input.creditCardId || null, p_description: input.description, p_frequency: input.frequency, p_generate_until: input.generateUntil, p_notes: input.notes || null, p_starts_on: input.startsOn, p_workspace_id: workspace.id });
    if (error) throw new Error("Não foi possível criar a assinatura. Confirme a função SQL no Supabase e tente novamente.");
  }

  async update(id: string, input: CreateSubscriptionInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const today = getLocalIsoDate();
    const { error } = await supabase.from("recurring_rules").update({ amount_cents: input.amountCents, billing_day: input.billingDay, category_id: input.categoryId || null, credit_card_id: input.creditCardId || null, description: input.description, frequency: input.frequency, generate_until: input.generateUntil, notes: input.notes || null, payment_method: input.creditCardId ? "credit_card" : "other", starts_on: input.startsOn }).eq("id", id).eq("workspace_id", workspace.id).eq("rule_type", "subscription");
    if (error) throw new Error("Não foi possível atualizar a assinatura.");
    const { error: entriesError } = await supabase.from("financial_entries").delete().eq("recurring_rule_id", id).eq("workspace_id", workspace.id).eq("status", "pending").gte("occurred_on", today);
    if (entriesError) throw new Error("A assinatura foi atualizada, mas não foi possível recalcular a previsão.");
    const { error: generationError } = await supabase.rpc("generate_recurring_entries", { p_rule_id: id });
    if (generationError) throw new Error("A assinatura foi atualizada, mas não foi possível gerar a nova previsão.");
  }

  async deactivate(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const today = getLocalIsoDate();
    const { error } = await supabase.from("recurring_rules").update({ is_active: false }).eq("id", id).eq("workspace_id", workspace.id).eq("rule_type", "subscription");
    if (error) throw new Error("Não foi possível encerrar a assinatura.");
    const { error: entriesError } = await supabase.from("financial_entries").delete().eq("recurring_rule_id", id).eq("workspace_id", workspace.id).eq("status", "pending").gte("occurred_on", today);
    if (entriesError) throw new Error("A assinatura foi encerrada, mas não foi possível remover as previsões futuras.");
  }

  async reactivate(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("recurring_rules").update({ is_active: true }).eq("id", id).eq("workspace_id", workspace.id).eq("rule_type", "subscription");
    if (error) throw new Error("Não foi possível reativar a assinatura.");
    const { error: generationError } = await supabase.rpc("generate_recurring_entries", { p_rule_id: id });
    if (generationError) throw new Error("A assinatura foi reativada, mas não foi possível gerar as previsões.");
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { count, error: countError } = await supabase.from("financial_entries").select("id", { count: "exact", head: true }).eq("recurring_rule_id", id).eq("workspace_id", workspace.id).eq("status", "paid");
    if (countError) throw new Error("Não foi possível verificar o histórico da assinatura.");
    if (count) throw new Error("A assinatura possui pagamentos no histórico e não pode ser excluída. Mantenha-a encerrada.");
    const { error } = await supabase.from("recurring_rules").delete().eq("id", id).eq("workspace_id", workspace.id).eq("rule_type", "subscription").eq("is_active", false);
    if (error) throw new Error("Não foi possível excluir a assinatura.");
  }
}