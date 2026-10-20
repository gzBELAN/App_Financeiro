"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { ACTIVE_WORKSPACE_COOKIE, getActiveWorkspace } from "@/lib/workspaces/active-workspace";
import { SupabaseWorkspaceRepository } from "@/features/workspaces/infrastructure/supabase-workspace-repository";

export async function selectWorkspace(workspaceId: string) {
  const workspace = await getActiveWorkspace();
  const available = await new SupabaseWorkspaceRepository().list();
  if (!available.some((item) => item.id === workspaceId)) return { error: "Controle financeiro inválido." };
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspaceId, { httpOnly: true, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
  return { success: workspace.id === workspaceId ? "Controle já selecionado." : "Controle financeiro alterado." };
}

export async function addWorkspaceMember(_: { error?: string; success?: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "editor");
  if (!/^\S+@\S+\.\S+$/.test(email) || !["editor", "viewer"].includes(role)) return { error: "Informe e-mail e permissão válidos." };
  try {
    const workspace = await getActiveWorkspace();
    if (workspace.role !== "owner") return { error: "Somente o proprietário pode adicionar participantes." };
    await new SupabaseWorkspaceRepository().addMember(workspace.id, email, role as "editor" | "viewer");
    revalidatePath("/workspace");
    return { success: "Participante adicionado ao controle financeiro." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

function refreshWorkspaces() { revalidatePath("/workspace"); revalidatePath("/settings"); revalidatePath("/", "layout"); }

export async function createWorkspace(_: { error?: string; success?: string }, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 100) return { error: "Informe um nome entre 1 e 100 caracteres." };
  try {
    const id = await new SupabaseWorkspaceRepository().create(name);
    (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, id, { httpOnly: true, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    refreshWorkspaces();
    return { success: "Novo controle financeiro criado e selecionado." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function updateWorkspaceMemberRole(workspaceId: string, profileId: string, role: "editor" | "viewer") {
  try { await new SupabaseWorkspaceRepository().updateMemberRole(workspaceId, profileId, role); refreshWorkspaces(); return { success: "Permissão atualizada." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function removeWorkspaceMember(workspaceId: string, profileId: string) {
  try { await new SupabaseWorkspaceRepository().removeMember(workspaceId, profileId); refreshWorkspaces(); return { success: "Participante removido." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function transferWorkspaceOwnership(workspaceId: string, profileId: string) {
  try { await new SupabaseWorkspaceRepository().transferOwnership(workspaceId, profileId); refreshWorkspaces(); return { success: "Propriedade transferida. Você agora é editor neste controle." }; } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function deleteWorkspace(workspaceId: string) {
  try {
    const available = await new SupabaseWorkspaceRepository().list();
    if (available.length <= 1) return { error: "Crie ou mantenha outro controle antes de excluir este último." };
    await new SupabaseWorkspaceRepository().delete(workspaceId);
    (await cookies()).delete(ACTIVE_WORKSPACE_COOKIE);
    refreshWorkspaces();
    return { success: "Controle financeiro e seus dados foram excluídos." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}