"use server";

import { revalidatePath } from "next/cache";

import { parseFixedExpenseInput } from "@/features/fixed-expenses/application/fixed-expense-schema";
import { SupabaseFixedExpenseRepository } from "@/features/fixed-expenses/infrastructure/supabase-fixed-expense-repository";

export type FixedExpenseActionState = { error?: string; success?: string };

export async function createFixedExpense(_: FixedExpenseActionState, formData: FormData): Promise<FixedExpenseActionState> {
  const input = parseFixedExpenseInput({ amount: String(formData.get("amount") ?? ""), billingDay: String(formData.get("billingDay") ?? ""), categoryId: String(formData.get("categoryId") ?? ""), description: String(formData.get("description") ?? ""), frequency: String(formData.get("frequency") ?? ""), generateUntil: String(formData.get("generateUntil") ?? ""), notes: String(formData.get("notes") ?? ""), paymentMethod: String(formData.get("paymentMethod") ?? ""), startsOn: String(formData.get("startsOn") ?? "") });
  if ("error" in input) return input;
  try {
    await new SupabaseFixedExpenseRepository().create(input.data);
    ["/fixed-expenses", "/expenses", "/dashboard"].forEach((path) => revalidatePath(path));
    return { success: "Conta fixa criada e lançamentos futuros gerados com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}