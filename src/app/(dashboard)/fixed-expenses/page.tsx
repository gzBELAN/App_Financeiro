import { SupabaseCategoryRepository } from "@/features/categories/infrastructure/supabase-category-repository";
import { SupabaseFixedExpenseRepository } from "@/features/fixed-expenses/infrastructure/supabase-fixed-expense-repository";
import { FixedExpenseManager } from "@/features/fixed-expenses/presentation/fixed-expense-manager";

export const metadata = { title: "Contas fixas" };

export default async function FixedExpensesPage() {
  const [categories, expenses] = await Promise.all([new SupabaseCategoryRepository().list(), new SupabaseFixedExpenseRepository().list()]);
  return <main className="container space-y-6 py-8"><header><p className="text-sm font-medium text-primary">Gastos recorrentes</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Contas fixas</h1><p className="mt-2 text-muted-foreground">Projete despesas recorrentes e antecipe os próximos pagamentos.</p></header><FixedExpenseManager categories={categories.map(({ id, name }) => ({ id, name }))} expenses={expenses} /></main>;
}