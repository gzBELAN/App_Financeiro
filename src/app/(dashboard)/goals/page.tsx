import { SupabaseFinancialGoalRepository } from "@/features/financial-goals/infrastructure/supabase-financial-goal-repository";
import { FinancialGoalManager } from "@/features/financial-goals/presentation/financial-goal-manager";

export const metadata = { title: "Objetivos financeiros" };

export default async function GoalsPage() {
  const goals = await new SupabaseFinancialGoalRepository().list();
  return <main className="container space-y-6 py-8"><header><p className="text-sm font-medium text-primary">Planejamento</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Objetivos financeiros</h1><p className="mt-2 text-muted-foreground">Acompanhe suas metas, progresso e o valor que ainda falta alcançar.</p></header><FinancialGoalManager goals={goals} /></main>;
}