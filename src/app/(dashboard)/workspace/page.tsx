import { WorkspaceManager } from "@/features/workspaces/presentation/workspace-manager";
import { WorkspaceEmptyState } from "@/features/workspaces/presentation/workspace-empty-state";
import { SupabaseWorkspaceRepository } from "@/features/workspaces/infrastructure/supabase-workspace-repository";
import { cookies } from "next/headers";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspaces/active-workspace";

export const metadata = { title: "Controle compartilhado" };
export default async function WorkspacePage() { const workspaces = await new SupabaseWorkspaceRepository().list(); if (!workspaces.length) return <WorkspaceEmptyState />; const selectedId = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value; const activeWorkspace = workspaces.find((workspace) => workspace.id === selectedId) ?? workspaces[0]; const members = await new SupabaseWorkspaceRepository().listMembers(activeWorkspace.id); return <main className="container space-y-6 py-8"><header><p className="text-sm font-medium text-primary">Colaboração</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Controles financeiros e participantes</h1><p className="mt-2 text-muted-foreground">Crie controles independentes, compartilhe-os e administre todas as permissões.</p></header><WorkspaceManager activeWorkspace={activeWorkspace} members={members} workspaces={workspaces} /></main>; }