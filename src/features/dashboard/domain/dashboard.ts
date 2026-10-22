export type DashboardFilters = {
  referenceMonth: string;
};

export type DashboardData = {
  monthlySalaryCents: number;
  salaryRemainingCents: number;
  monthlyExpenseCents: number;
  nextSalaryCommitmentCents: number;
  nextSalaryCardInvoiceCents: number;
  nextSalaryFixedExpenseCents: number;
  nextSalaryCommitmentDetails: DashboardExpenseDetail[];
  pendingExpenseCents: number;
  monthlyExpenseDetails: DashboardExpenseDetail[];
  pendingExpenseDetails: DashboardExpenseDetail[];
  alerts: DashboardAlert[];
  categoryBreakdown: ChartDatum[];
  cardBreakdown: ChartDatum[];
  monthlyEvolution: MonthlyEvolutionDatum[];
  goals: DashboardGoal[];
  recentEntries: RecentEntry[];
};

export type ChartDatum = { name: string; value: number; color: string };
export type MonthlyEvolutionDatum = { month: string; expenses: number; income: number };
export type DashboardGoal = { id: string; name: string; currentCents: number; targetCents: number; color: string };
export type DashboardExpenseDetail = { id: string; description: string; amountCents: number; date: string; source: "Fatura do cartão" | "Lançamento"; status: "pending" | "paid"; cardName?: string };
export type RecentEntry = { id: string; description: string; occurredOn: string; amountCents: number; status: "pending" | "paid" | "cancelled"; categoryName: string | null; categoryColor: string | null };
export type DashboardAlert = { id: "salary-budget" | "pending-payments" | "next-salary-budget"; severity: "warning" | "critical"; title: string; description: string };

export interface DashboardRepository {
  getData(filters: DashboardFilters): Promise<DashboardData>;
}