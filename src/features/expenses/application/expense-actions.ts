"use server";

import { revalidatePath } from "next/cache";

import { expenseSchema, parseCurrencyToCents } from "@/features/expenses/application/expense-schema";
import { SupabaseExpenseRepository } from "@/features/expenses/infrastructure/supabase-expense-repository";

export type ExpenseActionState = { error?: string; success?: string };

const repository = new SupabaseExpenseRepository();

function readInput(formData: FormData) {
  const validation = expenseSchema.safeParse({
    amount: String(formData.get("amount") ?? ""),
    bankAccountId: String(formData.get("bankAccountId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    description: String(formData.get("description") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    occurredOn: String(formData.get("occurredOn") ?? ""),
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    status: String(formData.get("status") ?? "pending"),
    kind: String(formData.get("kind") ?? "expense"),
  });

  if (!validation.success) return { error: validation.error.issues[0]?.message ?? "Dados inválidos." } as const;

  const amountCents = parseCurrencyToCents(validation.data.amount);
  if (!amountCents) return { error: "Informe um valor maior que zero." } as const;

  return { data: { ...validation.data, amountCents } } as const;
}

function refreshExpenses() {
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function createExpense(_: ExpenseActionState, formData: FormData): Promise<ExpenseActionState> {
  const input = readInput(formData);
  if ("error" in input) return input;

  try {
    await repository.create(input.data);
    refreshExpenses();
    return { success: input.data.kind === "income" ? "Receita registrada com sucesso." : "Despesa registrada com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

export async function updateExpense(_: ExpenseActionState, formData: FormData): Promise<ExpenseActionState> {
  const id = String(formData.get("id") ?? "");
  const input = readInput(formData);
  if (!id) return { error: "Lançamento inválido." };
  if ("error" in input) return input;

  try {
    await repository.update({ id, ...input.data });
    refreshExpenses();
    return { success: input.data.kind === "income" ? "Receita atualizada com sucesso." : "Despesa atualizada com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

export async function deleteExpense(id: string): Promise<ExpenseActionState> {
  if (!id) return { error: "Lançamento inválido." };

  try {
    await repository.delete(id);
    refreshExpenses();
    return { success: "Lançamento excluído com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}