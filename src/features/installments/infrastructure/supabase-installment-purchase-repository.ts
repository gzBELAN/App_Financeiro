import type { AdvanceInstallmentsInput, CreateInstallmentPurchaseInput, InstallmentPurchase, InstallmentPurchaseRepository } from "@/features/installments/domain/installment-purchase";
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
  categories: { name: string } | null;
  financial_entries: { id: string; installment_number: number; installment_count: number; amount_cents: number; occurred_on: string; status: "pending" | "paid" | "cancelled" }[] | null;
};

export class SupabaseInstallmentPurchaseRepository implements InstallmentPurchaseRepository {
  async list(): Promise<InstallmentPurchase[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase.from("installment_purchases").select("id, description, total_amount_cents, installment_count, purchase_date, notes, credit_cards(name), categories(name), financial_entries(id, installment_number, installment_count, amount_cents, occurred_on, status)").eq("workspace_id", workspace.id).order("purchase_date", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os parcelamentos.");

    return (data as unknown as PurchaseRow[]).map((purchase) => ({
      categoryName: purchase.categories?.name ?? null,
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
    const { data: entries, error: entriesError } = await supabase.from("financial_entries").select("id, amount_cents").eq("workspace_id", workspace.id).eq("installment_purchase_id", input.purchaseId).eq("status", "pending").in("id", input.installmentIds);
    if (entriesError || !entries || entries.length !== input.installmentIds.length) throw new Error("Não foi possível localizar todas as parcelas pendentes selecionadas.");
    const totalCents = (entries as { id: string; amount_cents: number }[]).reduce((sum, entry) => sum + entry.amount_cents, 0);
    if (input.discountCents < 0 || input.discountCents >= totalCents) throw new Error("O desconto deve ser menor que o total das parcelas adiantadas.");
    const orderedEntries = [...entries as { id: string; amount_cents: number }[]].sort((left, right) => left.id.localeCompare(right.id));
    let remainingDiscount = input.discountCents;
    for (const [index, entry] of orderedEntries.entries()) {
      const proportionalDiscount = index === orderedEntries.length - 1 ? remainingDiscount : Math.floor((entry.amount_cents * input.discountCents) / totalCents);
      remainingDiscount -= proportionalDiscount;
      const { error } = await supabase.from("financial_entries").update({ amount_cents: entry.amount_cents - proportionalDiscount, occurred_on: new Date().toISOString().slice(0, 10), status: "paid" }).eq("id", entry.id).eq("workspace_id", workspace.id).eq("status", "pending");
      if (error) throw new Error("Não foi possível concluir o adiantamento das parcelas.");
    }
  }
}