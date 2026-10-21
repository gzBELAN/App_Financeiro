export const CARD_TYPES = ["credit", "debit", "credit_debit"] as const;
export type CardType = (typeof CARD_TYPES)[number];

export type CreditCard = {
  id: string;
  bankAccountId: string;
  name: string;
  bankName: string;
  brand: string;
  cardType: CardType;
  creditLimitCents: number;
  closingDay: number;
  dueDay: number;
  color: string;
  isActive: boolean;
};

export type CreditCardInput = Omit<CreditCard, "id" | "isActive">;
export type UpdateCreditCardInput = CreditCardInput & { id: string };

export type CreditCardInvoice = {
  cardId: string;
  cardName: string;
  color: string;
  creditLimitCents: number;
  dueDate: string;
  itemCount: number;
  paidCents: number;
  pendingCents: number;
  totalCents: number;
};

export interface CreditCardRepository {
  list(): Promise<CreditCard[]>;
  listInvoices(referenceDate: string): Promise<CreditCardInvoice[]>;
  create(input: CreditCardInput): Promise<void>;
  update(input: UpdateCreditCardInput): Promise<void>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}