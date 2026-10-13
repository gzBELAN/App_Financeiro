import { SupabaseCategoryRepository } from "@/features/categories/infrastructure/supabase-category-repository";
import { SupabaseCreditCardRepository } from "@/features/credit-cards/infrastructure/supabase-credit-card-repository";
import { SupabaseSubscriptionRepository } from "@/features/subscriptions/infrastructure/supabase-subscription-repository";
import { SubscriptionManager } from "@/features/subscriptions/presentation/subscription-manager";

export const metadata = { title: "Assinaturas" };

export default async function SubscriptionsPage() {
  const [cards, categories, subscriptions] = await Promise.all([new SupabaseCreditCardRepository().list(), new SupabaseCategoryRepository().list(), new SupabaseSubscriptionRepository().list()]);
  return <main className="container space-y-6 py-8"><header><p className="text-sm font-medium text-primary">Gastos recorrentes</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Assinaturas</h1><p className="mt-2 text-muted-foreground">Antecipe Netflix, Spotify e outros serviços recorrentes.</p></header><SubscriptionManager cards={cards.filter((card) => card.isActive).map(({ id, name }) => ({ id, name }))} categories={categories.map(({ id, name }) => ({ id, name }))} subscriptions={subscriptions} /></main>;
}