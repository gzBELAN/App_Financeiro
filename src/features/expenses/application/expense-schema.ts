import { z } from "zod";

import { PAYMENT_METHODS } from "@/features/expenses/domain/expense";

export const expenseSchema = z.object({
  amount: z.string().trim().min(1, "Informe o valor da despesa."),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().trim().min(1, "Informe a descrição.").max(200, "A descrição deve ter no máximo 200 caracteres."),
  notes: z.string().trim().max(2000, "As observações devem ter no máximo 2.000 caracteres.").optional(),
  occurredOn: z.string().date("Informe uma data válida."),
  paymentMethod: z.enum(PAYMENT_METHODS, { error: "Selecione uma forma de pagamento válida." }),
  status: z.enum(["pending", "paid"]),
});

export function parseCurrencyToCents(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace("R$", "");
  const decimalNormalized = normalized.includes(",")
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized;
  const amount = Number(decimalNormalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}