import { z } from "zod";

import { parseCurrencyToCents } from "@/features/expenses/application/expense-schema";

const FREQUENCIES = ["monthly", "quarterly", "semiannual", "annual"] as const;
const PAYMENT_METHODS = ["cash", "debit_card", "pix", "bank_transfer", "boleto", "other"] as const;

export const fixedExpenseSchema = z.object({
  amount: z.string().trim().min(1, "Informe o valor da conta."),
  billingDay: z.coerce.number().int().min(1, "O dia de cobrança deve estar entre 1 e 31.").max(31, "O dia de cobrança deve estar entre 1 e 31."),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().trim().min(1, "Informe a descrição.").max(200, "A descrição deve ter no máximo 200 caracteres."),
  frequency: z.enum(FREQUENCIES),
  generateUntil: z.string().date("Informe a data final da previsão."),
  notes: z.string().trim().max(2000, "As observações devem ter no máximo 2.000 caracteres.").optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  startsOn: z.string().date("Informe a data de início."),
});

export function parseFixedExpenseInput(value: unknown) {
  const validation = fixedExpenseSchema.safeParse(value);
  if (!validation.success) return { error: validation.error.issues[0]?.message ?? "Dados inválidos." } as const;
  if (validation.data.generateUntil < validation.data.startsOn) return { error: "A data final deve ser igual ou posterior à data de início." } as const;
  const amountCents = parseCurrencyToCents(validation.data.amount);
  if (amountCents === null) return { error: "Informe um valor maior que zero." } as const;
  return { data: { ...validation.data, amountCents } } as const;
}