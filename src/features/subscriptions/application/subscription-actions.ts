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
    ["/subscriptions", "/expenses", "/cards", "/dashboard"].forEach(revalidatePath);
    return { success: "Assinatura criada e lançamentos futuros gerados com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}