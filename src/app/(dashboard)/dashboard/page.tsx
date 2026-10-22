import { redirect } from "next/navigation";

import { DashboardView } from "@/features/dashboard/presentation/dashboard-view";
import { DashboardMonthSelector } from "@/features/dashboard/presentation/dashboard-month-selector";
import { SupabaseDashboardRepository } from "@/features/dashboard/infrastructure/supabase-dashboard-repository";
import { SupabaseWorkspaceRepository } from "@/features/workspaces/infrastructure/supabase-workspace-repository";
import { getLocalIsoMonth } from "@/lib/utils/date";

export const metadata = { title: "Dashboard" };

type DashboardPageProperties = { searchParams: Promise<{ month?: string }> };

function currentMonth() {
  return getLocalIsoMonth();
}

export default async function DashboardPage({ searchParams }: DashboardPageProperties) {
  const parameters = await searchParams;
  const referenceMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(parameters.month ?? "") ? parameters.month! : currentMonth();
  const workspaces = await new SupabaseWorkspaceRepository().list();
  if (!workspaces.length) redirect("/workspace");
  const data = await new SupabaseDashboardRepository().getData({ referenceMonth });

  return (
    <main className="container space-y-6 py-8">
      <header className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Visão geral</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard financeiro</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe seus gastos, previsões e objetivos.</p>
        </div>
        <DashboardMonthSelector referenceMonth={referenceMonth} />
      </header>
      <DashboardView data={data} />
    </main>
  );
}