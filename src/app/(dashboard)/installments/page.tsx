import { SupabaseCategoryRepository } from "@/features/categories/infrastructure/supabase-category-repository";
import { SupabaseCreditCardRepository } from "@/features/credit-cards/infrastructure/supabase-credit-card-repository";
import { SupabaseInstallmentPurchaseRepository } from "@/features/installments/infrastructure/supabase-installment-purchase-repository";
import { InstallmentManager } from "@/features/installments/presentation/installment-manager";

export const metadata = { title: "Parcelamentos" };

export default async function InstallmentsPage() {
  const [cards, categories, purchases] = await Promise.all([new SupabaseCreditCardRepository().list(), new SupabaseCategoryRepository().list(), new SupabaseInstallmentPurchaseRepository().list()]);
  return <main className="container space-y-6 py-8"><header><p className="text-sm font-medium text-primary">Compras no cartão</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Parcelamentos</h1><p className="mt-2 text-muted-foreground">Planeje compras e acompanhe cada parcela futura.</p></header><InstallmentManager cards={cards.filter((card) => card.isActive).map(({ id, name }) => ({ id, name }))} categories={categories.map(({ id, name }) => ({ id, name }))} purchases={purchases} /></main>;
}