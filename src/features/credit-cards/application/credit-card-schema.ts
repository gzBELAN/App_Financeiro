import { z } from "zod";

import { parseCurrencyToCents } from "@/features/expenses/application/expense-schema";

export const creditCardSchema = z.object({
  bankAccountId: z.string().uuid("Selecione a conta bancária."),
  brand: z.string().trim().min(1, "Informe a bandeira.").max(40, "A bandeira deve ter no máximo 40 caracteres."),
  cardType: z.enum(["credit", "debit", "credit_debit"]),
  closingDay: z.coerce.number().int().min(1, "O fechamento deve estar entre 1 e 31.").max(31, "O fechamento deve estar entre 1 e 31."),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Informe uma cor hexadecimal válida."),
  creditLimit: z.string().trim().min(1, "Informe o limite do cartão."),
  dueDay: z.coerce.number().int().min(1, "O vencimento deve estar entre 1 e 31.").max(31, "O vencimento deve estar entre 1 e 31."),
  name: z.string().trim().min(1, "Informe o nome do cartão.").max(80, "O nome deve ter no máximo 80 caracteres."),
});

export function parseCreditCardInput(value: unknown) {
  const validation = creditCardSchema.safeParse(value);
  if (!validation.success) return { error: validation.error.issues[0]?.message ?? "Dados inválidos." } as const;

  const creditLimitCents = parseCurrencyToCents(validation.data.creditLimit);
  if (creditLimitCents === null) return { error: "Informe um limite maior que zero." } as const;

  return { data: { ...validation.data, creditLimitCents } } as const;
}