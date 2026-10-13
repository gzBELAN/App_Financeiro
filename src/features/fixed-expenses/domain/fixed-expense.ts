import type { PaymentMethod } from "@/features/expenses/domain/expense";
import type { RecurrenceFrequency } from "@/features/subscriptions/domain/subscription";

export type FixedExpense = {
  id: string;
  description: string;
  amountCents: number;
  frequency: RecurrenceFrequency;
  billingDay: number;
  startsOn: string;
  generateUntil: string;
  paymentMethod: Exclude<PaymentMethod, "credit_card">;
  categoryName: string | null;
  isActive: boolean;
  upcomingEntries: { id: string; occurredOn: string; amountCents: number }[];
};

export type CreateFixedExpenseInput = {
  description: string;
  amountCents: number;
  categoryId?: string;
  paymentMethod: Exclude<PaymentMethod, "credit_card">;
  frequency: RecurrenceFrequency;
  billingDay: number;
  startsOn: string;
  generateUntil: string;
  notes?: string;
};

export interface FixedExpenseRepository {
  list(): Promise<FixedExpense[]>;
  create(input: CreateFixedExpenseInput): Promise<void>;
}