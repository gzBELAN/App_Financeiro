import { cookies } from "next/headers";

import { SupabaseWorkspaceRepository } from "@/features/workspaces/infrastructure/supabase-workspace-repository";

export const ACTIVE_WORKSPACE_COOKIE = "app-financeiro-workspace";

export async function getActiveWorkspace() {
  const workspaces = await new SupabaseWorkspaceRepository().list();
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const workspace = workspaces.find((item) => item.id === selectedId) ?? workspaces[0];
  if (!workspace) throw new Error("Nenhum controle financeiro está disponível para esta conta.");
  return workspace;
}