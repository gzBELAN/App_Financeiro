export const PAYMENT_METHODS = ["cash", "debit_card", "credit_card", "pix", "bank_transfer", "boleto", "other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type EntryKind = "expense" | "income";

export type Expense = {
  id: string;
  description: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  bankAccountId: string | null;
  bankAccountName: string | null;
  creditCardId: string | null;
  paymentMethod: PaymentMethod;
  notes: string | null;
  status: "pending" | "paid" | "cancelled";
  kind: EntryKind;
  installmentPurchaseId: string | null;
  installmentNumber: number | null;
  installmentCount: number | null;
  installmentAmountCents: number | null;
};

export type ExpenseInput = {
  description: string;
  amountCents: number;
  occurredOn: string;
  categoryId?: string;
  bankAccountId?: string;
  creditCardId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: "pending" | "paid";
  kind: EntryKind;
};

export type UpdateExpenseInput = ExpenseInput & { id: string };

export interface ExpenseRepository {
  list(): Promise<Expense[]>;
  create(input: ExpenseInput): Promise<void>;
  update(input: UpdateExpenseInput): Promise<void>;
  delete(id: string): Promise<void>;
}