"use server";

import { revalidatePath } from "next/cache";

import { parseFixedExpenseInput } from "@/features/fixed-expenses/application/fixed-expense-schema";
import { parseCurrencyToCents } from "@/features/expenses/application/expense-schema";
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

function refreshFixedExpenses() { ["/fixed-expenses", "/expenses", "/dashboard", "/reports"].forEach((path) => revalidatePath(path)); }

export async function updateFixedExpense(_: FixedExpenseActionState, formData: FormData): Promise<FixedExpenseActionState> {
  const id = String(formData.get("id") ?? "");
  const input = parseFixedExpenseInput({ amount: String(formData.get("amount") ?? ""), billingDay: String(formData.get("billingDay") ?? ""), categoryId: String(formData.get("categoryId") ?? ""), description: String(formData.get("description") ?? ""), frequency: String(formData.get("frequency") ?? ""), generateUntil: String(formData.get("generateUntil") ?? ""), notes: String(formData.get("notes") ?? ""), paymentMethod: String(formData.get("paymentMethod") ?? ""), startsOn: String(formData.get("startsOn") ?? "") });
  if (!id) return { error: "Conta fixa inválida." };
  if ("error" in input) return input;
  try { await new SupabaseFixedExpenseRepository().update(id, input.data); refreshFixedExpenses(); return { success: "Conta fixa atualizada e previsão recalculada." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function deactivateFixedExpense(id: string): Promise<FixedExpenseActionState> {
  if (!id) return { error: "Conta fixa inválida." };
  try { await new SupabaseFixedExpenseRepository().deactivate(id); refreshFixedExpenses(); return { success: "Conta fixa encerrada; somente os valores reais confirmados foram mantidos." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function recordFixedExpenseActualAmount(_: FixedExpenseActionState, formData: FormData): Promise<FixedExpenseActionState> {
  const entryId = String(formData.get("entryId") ?? "");
  const amountCents = parseCurrencyToCents(String(formData.get("amount") ?? ""));
  if (!entryId || !amountCents) return { error: "Informe um valor real válido." };
  try { await new SupabaseFixedExpenseRepository().recordActualAmount(entryId, amountCents); refreshFixedExpenses(); return { success: "Valor real registrado como pago." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function reactivateFixedExpense(id: string): Promise<FixedExpenseActionState> {
  if (!id) return { error: "Conta fixa inválida." };
  try { await new SupabaseFixedExpenseRepository().reactivate(id); refreshFixedExpenses(); return { success: "Conta fixa reativada e previsões geradas." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function deleteFixedExpense(id: string): Promise<FixedExpenseActionState> {
  if (!id) return { error: "Conta fixa inválida." };
  try { await new SupabaseFixedExpenseRepository().delete(id); refreshFixedExpenses(); return { success: "Conta fixa e todo o seu histórico foram excluídos completamente." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}