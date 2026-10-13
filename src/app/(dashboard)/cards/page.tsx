import { SupabaseCreditCardRepository } from "@/features/credit-cards/infrastructure/supabase-credit-card-repository";
import { CreditCardManager } from "@/features/credit-cards/presentation/credit-card-manager";

export const metadata = { title: "Cartões" };

export default async function CardsPage() {
  const cards = await new SupabaseCreditCardRepository().list();
  return <main className="container space-y-6 py-8"><header><p className="text-sm font-medium text-primary">Pagamentos</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Cartões de crédito</h1><p className="mt-2 text-muted-foreground">Organize limites, ciclos de fechamento e vencimentos dos seus cartões.</p></header><CreditCardManager cards={cards} /></main>;
}