"use server";

import { revalidatePath } from "next/cache";

import { parseCreditCardInput } from "@/features/credit-cards/application/credit-card-schema";
import { SupabaseCreditCardRepository } from "@/features/credit-cards/infrastructure/supabase-credit-card-repository";

export type CreditCardActionState = { error?: string; success?: string };
const repository = new SupabaseCreditCardRepository();

function readInput(formData: FormData) {
  return parseCreditCardInput({ bankAccountId: String(formData.get("bankAccountId") ?? ""), brand: String(formData.get("brand") ?? ""), cardType: String(formData.get("cardType") ?? "credit"), closingDaysBeforeDue: String(formData.get("closingDaysBeforeDue") ?? ""), color: String(formData.get("color") ?? ""), creditLimit: String(formData.get("creditLimit") ?? ""), dueDay: String(formData.get("dueDay") ?? ""), name: String(formData.get("name") ?? "") });
}

function refreshCards() {
  revalidatePath("/cards");
  revalidatePath("/dashboard");
}

export async function createCreditCard(_: CreditCardActionState, formData: FormData): Promise<CreditCardActionState> {
  const input = readInput(formData);
  if ("error" in input) return input;
  try { await repository.create(input.data); refreshCards(); return { success: "Cartão cadastrado com sucesso." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function updateCreditCard(_: CreditCardActionState, formData: FormData): Promise<CreditCardActionState> {
  const id = String(formData.get("id") ?? "");
  const input = readInput(formData);
  if (!id) return { error: "Cartão inválido." };
  if ("error" in input) return input;
  try { await repository.update({ id, ...input.data }); refreshCards(); return { success: "Cartão atualizado com sucesso." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function archiveCreditCard(id: string): Promise<CreditCardActionState> {
  if (!id) return { error: "Cartão inválido." };
  try { await repository.archive(id); refreshCards(); return { success: "Cartão arquivado com sucesso." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function restoreCreditCard(id: string): Promise<CreditCardActionState> {
  if (!id) return { error: "Cartão inválido." };
  try { await repository.restore(id); refreshCards(); return { success: "Cartão reativado com sucesso." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function deleteCreditCard(id: string): Promise<CreditCardActionState> {
  if (!id) return { error: "Cartão inválido." };
  try { await repository.delete(id); refreshCards(); return { success: "Cartão excluído permanentemente." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}