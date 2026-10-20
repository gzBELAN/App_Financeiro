import type { FinancialGoal, FinancialGoalInput, FinancialGoalRepository, UpdateFinancialGoalInput } from "@/features/financial-goals/domain/financial-goal";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type FinancialGoalRow = { id: string; name: string; target_amount_cents: number; current_amount_cents: number; target_date: string | null; color: string; is_archived: boolean };
const mapGoal = (goal: FinancialGoalRow): FinancialGoal => ({ color: goal.color, currentAmountCents: goal.current_amount_cents, id: goal.id, isArchived: goal.is_archived, name: goal.name, targetAmountCents: goal.target_amount_cents, targetDate: goal.target_date });

export class SupabaseFinancialGoalRepository implements FinancialGoalRepository {
  async list(): Promise<FinancialGoal[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase.from("financial_goals").select("id, name, target_amount_cents, current_amount_cents, target_date, color, is_archived").eq("workspace_id", workspace.id).order("is_archived", { ascending: true }).order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os objetivos financeiros.");
    return (data as FinancialGoalRow[]).map(mapGoal);
  }

  async create(input: FinancialGoalInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    const { error } = await supabase.from("financial_goals").insert({ color: input.color, current_amount_cents: input.currentAmountCents, name: input.name, target_amount_cents: input.targetAmountCents, target_date: input.targetDate, user_id: user.id, workspace_id: workspace.id, created_by_id: user.id });
    if (error?.code === "23505") throw new Error("Já existe um objetivo com este nome.");
    if (error) throw new Error("Não foi possível criar o objetivo.");
  }

  async update(input: UpdateFinancialGoalInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("financial_goals").update({ color: input.color, current_amount_cents: input.currentAmountCents, name: input.name, target_amount_cents: input.targetAmountCents, target_date: input.targetDate }).eq("id", input.id).eq("workspace_id", workspace.id);
    if (error?.code === "23505") throw new Error("Já existe um objetivo com este nome.");
    if (error) throw new Error("Não foi possível atualizar o objetivo.");
  }

  async archive(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("financial_goals").update({ is_archived: true }).eq("id", id).eq("workspace_id", workspace.id);
    if (error) throw new Error("Não foi possível arquivar o objetivo.");
  }
}