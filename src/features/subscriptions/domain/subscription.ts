export type RecurrenceFrequency = "monthly" | "quarterly" | "semiannual" | "annual";

export type Subscription = {
  id: string;
  description: string;
  amountCents: number;
  frequency: RecurrenceFrequency;
  billingDay: number;
  startsOn: string;
  generateUntil: string;
  categoryId: string | null;
  creditCardId: string | null;
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
  update(id: string, input: CreateSubscriptionInput): Promise<void>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}