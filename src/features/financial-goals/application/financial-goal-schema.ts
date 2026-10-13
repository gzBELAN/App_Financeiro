import { z } from "zod";

import { parseCurrencyToCents } from "@/features/expenses/application/expense-schema";

export const financialGoalSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Informe uma cor hexadecimal válida."),
  currentAmount: z.string().trim().min(1, "Informe o valor atual."),
  name: z.string().trim().min(1, "Informe o nome do objetivo.").max(100, "O nome deve ter no máximo 100 caracteres."),
  targetAmount: z.string().trim().min(1, "Informe o valor da meta."),
  targetDate: z.string().date("Informe uma data válida.").optional().or(z.literal("")),
});

export function parseFinancialGoalInput(value: unknown) {
  const validation = financialGoalSchema.safeParse(value);
  if (!validation.success) return { error: validation.error.issues[0]?.message ?? "Dados inválidos." } as const;
  const currentAmountCents = parseCurrencyToCents(validation.data.currentAmount);
  const targetAmountCents = parseCurrencyToCents(validation.data.targetAmount);
  if (currentAmountCents === null) return { error: "Informe um valor atual igual ou maior que zero." } as const;
  if (targetAmountCents === null) return { error: "Informe uma meta maior que zero." } as const;
  return { data: { color: validation.data.color, currentAmountCents, name: validation.data.name, targetAmountCents, targetDate: validation.data.targetDate || null } } as const;
}