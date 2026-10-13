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