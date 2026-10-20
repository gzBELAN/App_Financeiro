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
  categoryId: string | null;
  paymentMethod: Exclude<PaymentMethod, "credit_card">;
  categoryName: string | null;
  isActive: boolean;
  upcomingEntries: { id: string; occurredOn: string; amountCents: number; status: "pending" | "paid" | "cancelled" }[];
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
  update(id: string, input: CreateFixedExpenseInput): Promise<void>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  recordActualAmount(entryId: string, amountCents: number): Promise<void>;
}