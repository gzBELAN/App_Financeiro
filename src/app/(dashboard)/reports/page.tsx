import { SupabaseCategoryRepository } from "@/features/categories/infrastructure/supabase-category-repository";
import { SupabaseCreditCardRepository } from "@/features/credit-cards/infrastructure/supabase-credit-card-repository";
import { SupabaseReportRepository } from "@/features/reports/infrastructure/supabase-report-repository";
import { ReportView } from "@/features/reports/presentation/report-view";

export const metadata = { title: "Relatórios" };
type PageProperties = { searchParams: Promise<{ startsOn?: string; endsOn?: string; categoryId?: string; creditCardId?: string; source?: "all" | "subscription" | "fixed_expense" }> };
const validDate = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export default async function ReportsPage({ searchParams }: PageProperties) {
  const query = await searchParams; const now = new Date(); const startsOn = validDate(query.startsOn) ? query.startsOn! : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`; const endsOn = validDate(query.endsOn) ? query.endsOn! : now.toISOString().slice(0, 10); const filters = { categoryId: query.categoryId, creditCardId: query.creditCardId, endsOn, source: query.source ?? "all", startsOn };
  const [cards, categories, data] = await Promise.all([new SupabaseCreditCardRepository().list(), new SupabaseCategoryRepository().list(), new SupabaseReportRepository().getData(filters)]);
  return <main className="container space-y-6 py-8"><header><p className="text-sm font-medium text-primary">Análise financeira</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Relatórios</h1><p className="mt-2 text-muted-foreground">Filtre seus lançamentos e exporte os dados para CSV ou Excel.</p></header><ReportView cards={cards.map(({ id, name }) => ({ id, name }))} categories={categories.map(({ id, name }) => ({ id, name }))} data={data} filters={filters} /></main>;
}