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
    notes: String(formData.get("notes") ?? ""),
    purchaseDate: String(formData.get("purchaseDate") ?? ""),
    totalAmount: String(formData.get("totalAmount") ?? ""),
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
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id || !description || description.length > 200) return { error: "Informe uma descrição válida para a compra." };
  if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)) return { error: "Categoria inválida." };
  if (notes.length > 2000) return { error: "As observações devem ter no máximo 2.000 caracteres." };
  try { await repository.update({ categoryId: categoryId || undefined, description, id, notes: notes || undefined }); refreshInstallments(); return { success: "Compra parcelada atualizada. Parcelas pendentes foram sincronizadas." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function deleteInstallmentPurchase(id: string): Promise<InstallmentActionState> {
  if (!id) return { error: "Compra parcelada inválida." };
  try { await repository.delete(id); refreshInstallments(); return { success: "Compra parcelada excluída." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}