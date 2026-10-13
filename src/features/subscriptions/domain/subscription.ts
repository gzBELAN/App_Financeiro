export type RecurrenceFrequency = "monthly" | "quarterly" | "semiannual" | "annual";

export type Subscription = {
  id: string;
  description: string;
  amountCents: number;
  frequency: RecurrenceFrequency;
  billingDay: number;
  startsOn: string;
  generateUntil: string;
  creditCardName: string | null;
  categoryName: string | null;
  isActive: boolean;
  upcomingEntries: { id: string; occurredOn: string; amountCents: number }[];
};

export type CreateSubscriptionInput = {
  description: string;
  amountCents: number;
  categoryId?: string;
  creditCardId?: string;
  frequency: RecurrenceFrequency;
  billingDay: number;
  startsOn: string;
  generateUntil: string;
  notes?: string;
};

export interface SubscriptionRepository {
  list(): Promise<Subscription[]>;
  create(input: CreateSubscriptionInput): Promise<void>;
}