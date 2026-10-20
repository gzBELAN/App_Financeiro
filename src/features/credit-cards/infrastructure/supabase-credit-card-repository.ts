import type { CreditCard, CreditCardInput, CreditCardRepository, UpdateCreditCardInput } from "@/features/credit-cards/domain/credit-card";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type CreditCardRow = {
  id: string;
  name: string;
  bank_name: string;
  brand: string;
  credit_limit_cents: number;
  closing_day: number;
  due_day: number;
  color: string;
  is_active: boolean;
};

function mapCard(card: CreditCardRow): CreditCard {
  return { bankName: card.bank_name, brand: card.brand, closingDay: card.closing_day, color: card.color, creditLimitCents: card.credit_limit_cents, dueDay: card.due_day, id: card.id, isActive: card.is_active, name: card.name };
}

export class SupabaseCreditCardRepository implements CreditCardRepository {
  async list(): Promise<CreditCard[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase.from("credit_cards").select("id, name, bank_name, brand, credit_limit_cents, closing_day, due_day, color, is_active").eq("workspace_id", workspace.id).order("is_active", { ascending: false }).order("name");
    if (error) throw new Error("Não foi possível carregar os cartões.");
    return (data as CreditCardRow[]).map(mapCard);
  }

  async create(input: CreditCardInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sua sessão expirou. Entre novamente para continuar.");

    const { error } = await supabase.from("credit_cards").insert({ bank_name: input.bankName, brand: input.brand, closing_day: input.closingDay, color: input.color, credit_limit_cents: input.creditLimitCents, due_day: input.dueDay, name: input.name, user_id: user.id, workspace_id: workspace.id, created_by_id: user.id });
    if (error?.code === "23505") throw new Error("Já existe um cartão com este nome.");
    if (error) throw new Error("Não foi possível cadastrar o cartão.");
  }

  async update(input: UpdateCreditCardInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("credit_cards").update({ bank_name: input.bankName, brand: input.brand, closing_day: input.closingDay, color: input.color, credit_limit_cents: input.creditLimitCents, due_day: input.dueDay, name: input.name }).eq("id", input.id).eq("workspace_id", workspace.id);
    if (error?.code === "23505") throw new Error("Já existe um cartão com este nome.");
    if (error) throw new Error("Não foi possível atualizar o cartão.");
  }

  async archive(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("credit_cards").update({ is_active: false }).eq("id", id).eq("workspace_id", workspace.id);
    if (error) throw new Error("Não foi possível arquivar o cartão.");
  }
}