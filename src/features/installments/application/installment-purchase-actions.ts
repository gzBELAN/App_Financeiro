"use server";

import { revalidatePath } from "next/cache";

import { parseCurrencyToCents } from "@/features/expenses/application/expense-schema";
import { parseInstallmentPurchaseInput } from "@/features/installments/application/installment-purchase-schema";
import { SupabaseInstallmentPurchaseRepository } from "@/features/installments/infrastructure/supabase-installment-purchase-repository";

export type InstallmentActionState = { error?: string; success?: string };
const repository = new SupabaseInstallmentPurchaseRepository();

export async function createInstallmentPurchase(_: InstallmentActionState, formData: FormData): Promise<InstallmentActionState> {
  const input = parseInstallmentPurchaseInput({
    categoryId: String(formData.get("categoryId") ?? ""),
    creditCardId: String(formData.get("creditCardId") ?? ""),
    description: String(formData.get("description") ?? ""),
    installmentCount: String(formData.get("installmentCount") ?? ""),
    firstInstallmentInvoiceAdjustment: String(formData.get("firstInstallmentInvoiceAdjustment") ?? "0"),
    notes: String(formData.get("notes") ?? ""),
    purchaseDate: String(formData.get("purchaseDate") ?? formData.get("occurredOn") ?? ""),
    totalAmount: String(formData.get("totalAmount") ?? formData.get("amount") ?? ""),
  });
  if ("error" in input) return input;

  try {
    await repository.create(input.data);
    revalidatePath("/installments");
    revalidatePath("/expenses");
    revalidatePath("/cards");
    revalidatePath("/dashboard");
    return { success: "Compra parcelada e lançamentos futuros criados com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

function refreshInstallments() {
  ["/expenses", "/installments", "/cards", "/dashboard", "/reports"].forEach((path) => revalidatePath(path));
}

export async function advanceInstallments(_: InstallmentActionState, formData: FormData): Promise<InstallmentActionState> {
  const purchaseId = String(formData.get("purchaseId") ?? "");
  const installmentIds = formData.getAll("installmentId").map(String).filter(Boolean);
  const discount = String(formData.get("discount") ?? "").trim();
  const discountCents = discount ? parseCurrencyToCents(discount) : 0;
  if (!purchaseId || installmentIds.length === 0) return { error: "Selecione pelo menos uma parcela pendente." };
  if (discount && discountCents === null) return { error: "Informe um desconto válido ou deixe o campo vazio." };
  try {
    await repository.advance({ discountCents: discountCents ?? 0, installmentIds, purchaseId });
    refreshInstallments();
    return { success: "Parcelas adiantadas e registradas como pagas." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

export async function updateInstallmentPurchase(_: InstallmentActionState, formData: FormData): Promise<InstallmentActionState> {
  const id = String(formData.get("id") ?? "");
  const input = parseInstallmentPurchaseInput({
    categoryId: String(formData.get("categoryId") ?? ""),
    creditCardId: String(formData.get("creditCardId") ?? ""),
    description: String(formData.get("description") ?? ""),
    installmentCount: String(formData.get("installmentCount") ?? ""),
    firstInstallmentInvoiceAdjustment: String(formData.get("firstInstallmentInvoiceAdjustment") ?? "0"),
    notes: String(formData.get("notes") ?? ""),
    purchaseDate: String(formData.get("purchaseDate") ?? ""),
    totalAmount: String(formData.get("totalAmount") ?? ""),
  });
  if (!id) return { error: "Compra parcelada inválida." };
  if ("error" in input) return input;
  try { await repository.update({ ...input.data, id }); refreshInstallments(); return { success: "Compra parcelada atualizada e parcelas recalculadas." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function deleteInstallmentPurchase(id: string): Promise<InstallmentActionState> {
  if (!id) return { error: "Compra parcelada inválida." };
  try { await repository.delete(id); refreshInstallments(); return { success: "Compra parcelada excluída." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}