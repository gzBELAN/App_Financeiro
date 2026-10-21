import { SupabaseCategoryRepository } from "@/features/categories/infrastructure/supabase-category-repository";
import { SupabaseBankAccountRepository } from "@/features/bank-accounts/infrastructure/supabase-bank-account-repository";
import { SupabaseCreditCardRepository } from "@/features/credit-cards/infrastructure/supabase-credit-card-repository";
import { SupabaseExpenseRepository } from "@/features/expenses/infrastructure/supabase-expense-repository";
import { ExpenseManager } from "@/features/expenses/presentation/expense-manager";
import { SupabaseInstallmentPurchaseRepository } from "@/features/installments/infrastructure/supabase-installment-purchase-repository";
import { InstallmentManager } from "@/features/installments/presentation/installment-manager";

export const metadata = { title: "Lançamentos" };

export default async function ExpensesPage() {
  const [accounts, cards, categories, expenses, purchases] = await Promise.all([
    new SupabaseBankAccountRepository().list(),
    new SupabaseCreditCardRepository().list(),
    new SupabaseCategoryRepository().list(),
    new SupabaseExpenseRepository().list(),
    new SupabaseInstallmentPurchaseRepository().list(),
  ]);

  const categoryOptions = categories.map(({ id, name }) => ({ id, name }));
  return <main className="container space-y-10 py-8"><header><p className="text-sm font-medium text-primary">Movimentações</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Lançamentos</h1><p className="mt-2 text-muted-foreground">Registre receitas, saldo inicial, despesas avulsas e compras parceladas em um só lugar.</p></header><ExpenseManager accounts={accounts.filter((account) => account.isActive).map(({ id, name, bankName }) => ({ id, name, bankName }))} cards={cards.filter((card) => card.isActive).map(({ id, name }) => ({ id, name }))} categories={categoryOptions} expenses={expenses} /><div className="border-t pt-10"><InstallmentManager categories={categoryOptions} purchases={purchases} /></div></main>;
}