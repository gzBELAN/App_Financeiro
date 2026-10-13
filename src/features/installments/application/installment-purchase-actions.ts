"use server";

import { revalidatePath } from "next/cache";

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