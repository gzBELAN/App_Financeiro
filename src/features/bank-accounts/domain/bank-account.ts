export const BANK_ACCOUNT_TYPES = ["checking", "savings", "cash", "investment", "other"] as const;
export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export type BankAccount = {
  id: string;
  name: string;
  bankName: string;
  accountType: BankAccountType;
  currentBalanceCents: number;
  color: string;
  isActive: boolean;
};

export type BankAccountInput = Omit<BankAccount, "id" | "isActive">;
export type UpdateBankAccountInput = BankAccountInput & { id: string };

export interface BankAccountRepository {
  list(): Promise<BankAccount[]>;
  getMonthlySalary(): Promise<number>;
  create(input: BankAccountInput): Promise<void>;
  update(input: UpdateBankAccountInput): Promise<void>;
  archive(id: string): Promise<void>;
  updateMonthlySalary(amountCents: number): Promise<void>;
}