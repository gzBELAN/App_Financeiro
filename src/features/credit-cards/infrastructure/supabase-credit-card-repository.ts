import type { CreditCard, CreditCardInput, CreditCardInvoice, CreditCardRepository, UpdateCreditCardInput } from "@/features/credit-cards/domain/credit-card";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type CreditCardRow = {
  id: string;
  name: string;
  bank_name: string;
  bank_account_id: string;
  brand: string;
  card_type: CreditCard["cardType"];
  credit_limit_cents: number;
  closing_day: number;
  due_day: number;
  color: string;
  is_active: boolean;
};
type InvoiceItemRow = { credit_card_id: string; credit_card_name: string; amount_cents: number; due_date: string; status: "paid" | "pending" };

function mapCard(card: CreditCardRow): CreditCard {
  return { bankAccountId: card.bank_account_id, bankName: card.bank_name, brand: card.brand, cardType: card.card_type, closingDay: card.closing_day, color: card.color, creditLimitCents: card.credit_limit_cents, dueDay: card.due_day, id: card.id, isActive: card.is_active, name: card.name };
}

export class SupabaseCreditCardRepository implements CreditCardRepository {
  private async resolveBankName(bankAccountId: string, workspaceId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("bank_accounts").select("bank_name").eq("id", bankAccountId).eq("workspace_id", workspaceId).eq("is_active", true).single();
    if (error || !data) throw new Error("Selecione uma conta bancária ativa.");
    return data.bank_name as string;
  }

  async list(): Promise<CreditCard[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase.from("credit_cards").select("id, name, bank_name, bank_account_id, brand, card_type, credit_limit_cents, closing_day, due_day, color, is_active").eq("workspace_id", workspace.id).order("is_active", { ascending: false }).order("name");
    if (error) throw new Error("Não foi possível carregar os cartões.");
    return (data as CreditCardRow[]).map(mapCard);
  }

  async listInvoices(referenceDate: string): Promise<CreditCardInvoice[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const [{ data: cards, error: cardsError }, { data: items, error: itemsError }] = await Promise.all([
      supabase.from("credit_cards").select("id, name, color, credit_limit_cents").eq("workspace_id", workspace.id).eq("is_active", true).in("card_type", ["credit", "credit_debit"]),
      supabase.from("credit_card_invoice_items").select("credit_card_id, credit_card_name, amount_cents, due_date, status").eq("workspace_id", workspace.id).gte("due_date", referenceDate).order("due_date"),
    ]);
    if (cardsError || itemsError) throw new Error("Não foi possível carregar as faturas dos cartões.");

    const firstInvoiceByCard = new Map<string, InvoiceItemRow[]>();
    for (const item of (items ?? []) as InvoiceItemRow[]) {
      const current = firstInvoiceByCard.get(item.credit_card_id);
      if (!current) firstInvoiceByCard.set(item.credit_card_id, [item]);
      else if (current[0].due_date === item.due_date) current.push(item);
    }

    return (cards ?? []).map((card) => {
      const invoiceItems = firstInvoiceByCard.get(card.id) ?? [];
      const paidCents = invoiceItems.filter((item) => item.status === "paid").reduce((total, item) => total + item.amount_cents, 0);
      const pendingCents = invoiceItems.filter((item) => item.status === "pending").reduce((total, item) => total + item.amount_cents, 0);
      return { cardId: card.id, cardName: card.name, color: card.color, creditLimitCents: card.credit_limit_cents, dueDate: invoiceItems[0]?.due_date ?? "", itemCount: invoiceItems.length, paidCents, pendingCents, totalCents: paidCents + pendingCents };
    });
  }

  async create(input: CreditCardInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    const bankName = await this.resolveBankName(input.bankAccountId, workspace.id);

    const { error } = await supabase.from("credit_cards").insert({ bank_account_id: input.bankAccountId, bank_name: bankName, brand: input.brand, card_type: input.cardType, closing_day: input.closingDay, color: input.color, credit_limit_cents: input.creditLimitCents, due_day: input.dueDay, name: input.name, user_id: user.id, workspace_id: workspace.id, created_by_id: user.id });
    if (error?.code === "23505") throw new Error("Já existe um cartão com este nome.");
    if (error) throw new Error("Não foi possível cadastrar o cartão.");
  }

  async update(input: UpdateCreditCardInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const bankName = await this.resolveBankName(input.bankAccountId, workspace.id);
    const { error } = await supabase.from("credit_cards").update({ bank_account_id: input.bankAccountId, bank_name: bankName, brand: input.brand, card_type: input.cardType, closing_day: input.closingDay, color: input.color, credit_limit_cents: input.creditLimitCents, due_day: input.dueDay, name: input.name }).eq("id", input.id).eq("workspace_id", workspace.id);
    if (error?.code === "23505") throw new Error("Já existe um cartão com este nome.");
    if (error) throw new Error("Não foi possível atualizar o cartão.");
  }

  async archive(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("credit_cards").update({ is_active: false }).eq("id", id).eq("workspace_id", workspace.id);
    if (error) throw new Error("Não foi possível arquivar o cartão.");
  }

  async restore(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("credit_cards").update({ is_active: true }).eq("id", id).eq("workspace_id", workspace.id);
    if (error) throw new Error("Não foi possível reativar o cartão.");
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("credit_cards").delete().eq("id", id).eq("workspace_id", workspace.id).eq("is_active", false);
    if (error?.code === "23503") throw new Error("Este cartão possui lançamentos vinculados e não pode ser excluído. Mantenha-o arquivado para preservar o histórico.");
    if (error) throw new Error("Não foi possível excluir o cartão.");
  }
}