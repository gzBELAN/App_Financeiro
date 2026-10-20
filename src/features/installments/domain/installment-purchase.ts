export type InstallmentPurchase = {
  id: string;
  description: string;
  totalAmountCents: number;
  installmentCount: number;
  purchaseDate: string;
  notes: string | null;
  creditCardName: string;
  categoryName: string | null;
  installments: Installment[];
};

export type Installment = {
  id: string;
  number: number;
  count: number;
  amountCents: number;
  occurredOn: string;
  status: "pending" | "paid" | "cancelled";
};

export type CreateInstallmentPurchaseInput = {
  description: string;
  totalAmountCents: number;
  installmentCount: number;
  purchaseDate: string;
  creditCardId: string;
  categoryId?: string;
  notes?: string;
};

export type AdvanceInstallmentsInput = {
  purchaseId: string;
  installmentIds: string[];
  discountCents: number;
};

export interface InstallmentPurchaseRepository {
  list(): Promise<InstallmentPurchase[]>;
  create(input: CreateInstallmentPurchaseInput): Promise<void>;
  advance(input: AdvanceInstallmentsInput): Promise<void>;
}