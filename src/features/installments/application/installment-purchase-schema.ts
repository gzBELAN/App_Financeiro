import { z } from "zod";

import { parseCurrencyToCents } from "@/features/expenses/application/expense-schema";

export const installmentPurchaseSchema = z.object({
  categoryId: z.string().uuid().optional().or(z.literal("")),
  creditCardId: z.string().uuid("Selecione um cartão de crédito."),
  description: z.string().trim().min(1, "Informe a descrição da compra.").max(200, "A descrição deve ter no máximo 200 caracteres."),
  installmentCount: z.coerce.number().int().min(2, "Informe pelo menos 2 parcelas.").max(360, "O máximo é de 360 parcelas."),
  firstInstallmentInvoiceAdjustment: z.coerce.number().int().min(-1).max(1).default(0),
  notes: z.string().trim().max(2000, "As observações devem ter no máximo 2.000 caracteres.").optional(),
  purchaseDate: z.string().date("Informe uma data válida."),
  totalAmount: z.string().trim().min(1, "Informe o valor total."),
});

export function parseInstallmentPurchaseInput(value: unknown) {
  const validation = installmentPurchaseSchema.safeParse(value);
  if (!validation.success) return { error: validation.error.issues[0]?.message ?? "Dados inválidos." } as const;

  const totalAmountCents = parseCurrencyToCents(validation.data.totalAmount);
  if (totalAmountCents === null) return { error: "Informe um valor total maior que zero." } as const;

  return { data: { ...validation.data, firstInstallmentInvoiceAdjustment: validation.data.firstInstallmentInvoiceAdjustment as -1 | 0 | 1, totalAmountCents } } as const;
}