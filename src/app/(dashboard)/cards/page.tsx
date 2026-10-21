import { SupabaseBankAccountRepository } from "@/features/bank-accounts/infrastructure/supabase-bank-account-repository";
import { BankAccountManager } from "@/features/bank-accounts/presentation/bank-account-manager";
import { SupabaseCreditCardRepository } from "@/features/credit-cards/infrastructure/supabase-credit-card-repository";
import { CreditCardManager } from "@/features/credit-cards/presentation/credit-card-manager";

export const metadata = { title: "Bancos e contas" };

export default async function CardsPage() {
  const accountsRepository = new SupabaseBankAccountRepository();
  const [accounts, cards, monthlySalary] = await Promise.all([accountsRepository.list(), new SupabaseCreditCardRepository().list(), accountsRepository.getMonthlySalary()]);
  const activeAccounts = accounts.filter((account) => account.isActive).map(({ id, name, bankName }) => ({ id, name, bankName }));
  return <main className="container space-y-10 py-8"><header><p className="text-sm font-medium text-primary">Patrimônio e pagamentos</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Bancos e contas</h1><p className="mt-2 text-muted-foreground">Organize suas contas, saldo, salário mensal e os cartões vinculados a cada banco.</p></header><BankAccountManager accounts={accounts} monthlySalary={monthlySalary} /><section className="border-t pt-10"><header className="mb-6"><h2 className="text-2xl font-bold tracking-tight">Cartões</h2><p className="mt-1 text-muted-foreground">Cadastre cartões de crédito, débito ou múltiplos vinculados às suas contas.</p></header><CreditCardManager accounts={activeAccounts} cards={cards} /></section></main>;
}