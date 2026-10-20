import type { ReactNode } from "react";

import { AppNavigation } from "@/features/navigation/presentation/app-navigation";
import { ActiveWorkspaceSelector } from "@/features/workspaces/presentation/active-workspace-selector";
import { SupabaseWorkspaceRepository } from "@/features/workspaces/infrastructure/supabase-workspace-repository";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspaces/active-workspace";
import { cookies } from "next/headers";

type DashboardLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default async function DashboardLayout({ children }: DashboardLayoutProperties) {
  const workspaces = await new SupabaseWorkspaceRepository().list();
  const selectedId = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const activeWorkspace = workspaces.find((workspace) => workspace.id === selectedId) ?? workspaces[0];

  return <AppNavigation>{activeWorkspace ? <div className="container flex justify-end pt-5"><ActiveWorkspaceSelector activeWorkspaceId={activeWorkspace.id} workspaces={workspaces} /></div> : null}{children}</AppNavigation>;
}
