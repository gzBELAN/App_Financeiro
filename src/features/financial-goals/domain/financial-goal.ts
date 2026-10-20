export type FinancialGoal = {
  id: string;
  name: string;
  targetAmountCents: number;
  currentAmountCents: number;
  targetDate: string | null;
  color: string;
  isArchived: boolean;
};

export type FinancialGoalInput = Omit<FinancialGoal, "id" | "isArchived">;
export type UpdateFinancialGoalInput = FinancialGoalInput & { id: string };

export interface FinancialGoalRepository {
  list(): Promise<FinancialGoal[]>;
  create(input: FinancialGoalInput): Promise<void>;
  update(input: UpdateFinancialGoalInput): Promise<void>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}