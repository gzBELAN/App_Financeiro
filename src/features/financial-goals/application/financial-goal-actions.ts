"use server";

import { revalidatePath } from "next/cache";

import { parseFinancialGoalInput } from "@/features/financial-goals/application/financial-goal-schema";
import { SupabaseFinancialGoalRepository } from "@/features/financial-goals/infrastructure/supabase-financial-goal-repository";

export type FinancialGoalActionState = { error?: string; success?: string };
const repository = new SupabaseFinancialGoalRepository();

function readInput(formData: FormData) { return parseFinancialGoalInput({ color: String(formData.get("color") ?? ""), currentAmount: String(formData.get("currentAmount") ?? ""), name: String(formData.get("name") ?? ""), targetAmount: String(formData.get("targetAmount") ?? ""), targetDate: String(formData.get("targetDate") ?? "") }); }
function refreshGoals() { revalidatePath("/goals"); revalidatePath("/dashboard"); }

export async function createFinancialGoal(_: FinancialGoalActionState, formData: FormData): Promise<FinancialGoalActionState> {
  const input = readInput(formData); if ("error" in input) return input;
  try { await repository.create(input.data); refreshGoals(); return { success: "Objetivo criado com sucesso." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function updateFinancialGoal(_: FinancialGoalActionState, formData: FormData): Promise<FinancialGoalActionState> {
  const id = String(formData.get("id") ?? ""); const input = readInput(formData);
  if (!id) return { error: "Objetivo inválido." }; if ("error" in input) return input;
  try { await repository.update({ id, ...input.data }); refreshGoals(); return { success: "Objetivo atualizado com sucesso." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function archiveFinancialGoal(id: string): Promise<FinancialGoalActionState> {
  if (!id) return { error: "Objetivo inválido." };
  try { await repository.archive(id); refreshGoals(); return { success: "Objetivo arquivado com sucesso." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}