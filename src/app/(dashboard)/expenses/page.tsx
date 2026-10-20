import { SupabaseCategoryRepository } from "@/features/categories/infrastructure/supabase-category-repository";
import { SupabaseExpenseRepository } from "@/features/expenses/infrastructure/supabase-expense-repository";
import { ExpenseManager } from "@/features/expenses/presentation/expense-manager";

export const metadata = { title: "Lançamentos" };

export default async function ExpensesPage() {
  const [categories, expenses] = await Promise.all([
    new SupabaseCategoryRepository().list(),
    new SupabaseExpenseRepository().list(),
  ]);

  return <main className="container space-y-6 py-8"><header><p className="text-sm font-medium text-primary">Movimentações</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Receitas e despesas</h1><p className="mt-2 text-muted-foreground">Registre receitas, saldo inicial e despesas avulsas em um só lugar.</p></header><ExpenseManager categories={categories.map(({ id, name }) => ({ id, name }))} expenses={expenses} /></main>;
}