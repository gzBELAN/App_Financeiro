"use server";

import { revalidatePath } from "next/cache";

import { parseSubscriptionInput } from "@/features/subscriptions/application/subscription-schema";
import { SupabaseSubscriptionRepository } from "@/features/subscriptions/infrastructure/supabase-subscription-repository";

export type SubscriptionActionState = { error?: string; success?: string };

export async function createSubscription(_: SubscriptionActionState, formData: FormData): Promise<SubscriptionActionState> {
  const input = parseSubscriptionInput({ amount: String(formData.get("amount") ?? ""), billingDay: String(formData.get("billingDay") ?? ""), categoryId: String(formData.get("categoryId") ?? ""), creditCardId: String(formData.get("creditCardId") ?? ""), description: String(formData.get("description") ?? ""), frequency: String(formData.get("frequency") ?? ""), generateUntil: String(formData.get("generateUntil") ?? ""), notes: String(formData.get("notes") ?? ""), startsOn: String(formData.get("startsOn") ?? "") });
  if ("error" in input) return input;
  try {
    await new SupabaseSubscriptionRepository().create(input.data);
    ["/subscriptions", "/expenses", "/cards", "/dashboard"].forEach((path) => revalidatePath(path));
    return { success: "Assinatura criada e lançamentos futuros gerados com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

function refreshSubscriptions() { ["/subscriptions", "/expenses", "/cards", "/dashboard", "/reports"].forEach((path) => revalidatePath(path)); }

export async function updateSubscription(_: SubscriptionActionState, formData: FormData): Promise<SubscriptionActionState> {
  const id = String(formData.get("id") ?? "");
  const input = parseSubscriptionInput({ amount: String(formData.get("amount") ?? ""), billingDay: String(formData.get("billingDay") ?? ""), categoryId: String(formData.get("categoryId") ?? ""), creditCardId: String(formData.get("creditCardId") ?? ""), description: String(formData.get("description") ?? ""), frequency: String(formData.get("frequency") ?? ""), generateUntil: String(formData.get("generateUntil") ?? ""), notes: String(formData.get("notes") ?? ""), startsOn: String(formData.get("startsOn") ?? "") });
  if (!id) return { error: "Assinatura inválida." };
  if ("error" in input) return input;
  try { await new SupabaseSubscriptionRepository().update(id, input.data); refreshSubscriptions(); return { success: "Assinatura atualizada e previsão recalculada." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function deactivateSubscription(id: string): Promise<SubscriptionActionState> {
  if (!id) return { error: "Assinatura inválida." };
  try { await new SupabaseSubscriptionRepository().deactivate(id); refreshSubscriptions(); return { success: "Assinatura encerrada e previsões futuras removidas." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}