import { DashboardView } from "@/features/dashboard/presentation/dashboard-view";
import { SupabaseDashboardRepository } from "@/features/dashboard/infrastructure/supabase-dashboard-repository";

export const metadata = { title: "Dashboard" };

type DashboardPageProperties = { searchParams: Promise<{ month?: string }> };

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function DashboardPage({ searchParams }: DashboardPageProperties) {
  const parameters = await searchParams;
  const referenceMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(parameters.month ?? "") ? parameters.month! : currentMonth();
  const data = await new SupabaseDashboardRepository().getData({ referenceMonth });

  return (
    <main className="container space-y-6 py-8">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Visão geral</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard financeiro</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe seus gastos, previsões e objetivos.</p>
        </div>
        <form className="flex items-end gap-2">
          <label className="grid gap-1 text-sm font-medium" htmlFor="month">
            Período
            <input className="h-10 rounded-md border bg-background px-3" defaultValue={referenceMonth} id="month" name="month" type="month" />
          </label>
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Filtrar</button>
        </form>
      </header>
      <DashboardView data={data} />
    </main>
  );
}