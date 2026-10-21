import type { AdvanceInstallmentsInput, CreateInstallmentPurchaseInput, InstallmentPurchase, InstallmentPurchaseRepository, UpdateInstallmentPurchaseInput } from "@/features/installments/domain/installment-purchase";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type PurchaseRow = {
  id: string;
  description: string;
  total_amount_cents: number;
  installment_count: number;
  purchase_date: string;
  notes: string | null;
  credit_cards: { name: string } | null;
  credit_card_id: string;
  categories: { name: string } | null;
  category_id: string | null;
  financial_entries: { id: string; installment_number: number; installment_count: number; amount_cents: number; occurred_on: string; status: "pending" | "paid" | "cancelled" }[] | null;
};

export class SupabaseInstallmentPurchaseRepository implements InstallmentPurchaseRepository {
  async list(): Promise<InstallmentPurchase[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase.from("installment_purchases").select("id, description, total_amount_cents, installment_count, purchase_date, notes, credit_card_id, category_id, credit_cards(name), categories(name), financial_entries(id, installment_number, installment_count, amount_cents, occurred_on, status)").eq("workspace_id", workspace.id).order("purchase_date", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os parcelamentos.");

    return (data as unknown as PurchaseRow[]).map((purchase) => ({
      categoryName: purchase.categories?.name ?? null,
      categoryId: purchase.category_id,
      creditCardId: purchase.credit_card_id,
      creditCardName: purchase.credit_cards?.name ?? "Cartão indisponível",
      description: purchase.description,
      id: purchase.id,
      installmentCount: purchase.installment_count,
      installments: (purchase.financial_entries ?? []).sort((a, b) => a.installment_number - b.installment_number).map((entry) => ({ amountCents: entry.amount_cents, count: entry.installment_count, id: entry.id, number: entry.installment_number, occurredOn: entry.occurred_on, status: entry.status })),
      notes: purchase.notes,
      purchaseDate: purchase.purchase_date,
      totalAmountCents: purchase.total_amount_cents,
    }));
  }

  async create(input: CreateInstallmentPurchaseInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.rpc("create_installment_purchase", {
      p_category_id: input.categoryId || null,
      p_credit_card_id: input.creditCardId,
      p_description: input.description,
      p_installment_count: input.installmentCount,
      p_notes: input.notes || null,
      p_purchase_date: input.purchaseDate,
      p_total_amount_cents: input.totalAmountCents,
      p_workspace_id: workspace.id,
    });
    if (error) throw new Error("Não foi possível gerar o parcelamento. Confirme a configuração do banco e tente novamente.");
  }

  async advance(input: AdvanceInstallmentsInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.rpc("advance_installments", {
      p_discount_cents: input.discountCents,
      p_installment_ids: input.installmentIds,
      p_purchase_id: input.purchaseId,
      p_workspace_id: workspace.id,
    });
    if (error) throw new Error("Não foi possível concluir o adiantamento das parcelas.");
  }

  async update(input: UpdateInstallmentPurchaseInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.rpc("update_installment_purchase", {
      p_category_id: input.categoryId || null,
      p_description: input.description,
      p_notes: input.notes || null,
      p_purchase_id: input.id,
      p_workspace_id: workspace.id,
    });
    if (error) throw new Error("Não foi possível atualizar a compra parcelada e sincronizar as parcelas pendentes.");
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { count, error: countError } = await supabase.from("financial_entries").select("id", { count: "exact", head: true }).eq("installment_purchase_id", id).eq("workspace_id", workspace.id).eq("status", "paid");
    if (countError) throw new Error("Não foi possível verificar o histórico do parcelamento.");
    if (count) throw new Error("Este parcelamento possui parcelas pagas e não pode ser excluído. Mantenha-o para preservar o histórico.");
    const { error } = await supabase.from("installment_purchases").delete().eq("id", id).eq("workspace_id", workspace.id);
    if (error) throw new Error("Não foi possível excluir a compra parcelada.");
  }
}