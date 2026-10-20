import { createClient } from "@/lib/supabase/server";
import type { Workspace, WorkspaceMember } from "@/features/workspaces/domain/workspace";

export class SupabaseWorkspaceRepository {
  async list(): Promise<Workspace[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("workspace_members").select("role, financial_workspaces(id, name)").order("joined_at");
    if (error) throw new Error("Não foi possível carregar os controles financeiros.");
    return (data as unknown as { role: Workspace["role"]; financial_workspaces: { id: string; name: string } | null }[]).flatMap((item) => item.financial_workspaces ? [{ id: item.financial_workspaces.id, name: item.financial_workspaces.name, role: item.role }] : []);
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("workspace_members").select("role, profiles(id, display_name)").eq("workspace_id", workspaceId).order("joined_at");
    if (error) throw new Error("Não foi possível carregar os participantes.");
    return (data as unknown as { role: WorkspaceMember["role"]; profiles: { id: string; display_name: string | null } | null }[]).flatMap((item) => item.profiles ? [{ displayName: item.profiles.display_name, id: item.profiles.id, role: item.role }] : []);
  }

  async addMember(workspaceId: string, email: string, role: "editor" | "viewer") {
    const supabase = await createClient();
    const { error } = await supabase.rpc("add_workspace_member_by_email", { p_email: email, p_role: role, p_workspace_id: workspaceId });
    if (error) throw new Error("Não foi possível adicionar. A pessoa precisa criar uma conta antes e o e-mail deve estar correto.");
  }

  async create(name: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_financial_workspace", { p_name: name });
    if (error || !data) throw new Error("Não foi possível criar o controle financeiro.");
    return data as string;
  }

  async updateMemberRole(workspaceId: string, profileId: string, role: "editor" | "viewer") {
    const supabase = await createClient();
    const { error } = await supabase.rpc("update_workspace_member_role", { p_profile_id: profileId, p_role: role, p_workspace_id: workspaceId });
    if (error) throw new Error("Não foi possível alterar a permissão do participante.");
  }

  async removeMember(workspaceId: string, profileId: string) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("remove_workspace_member", { p_profile_id: profileId, p_workspace_id: workspaceId });
    if (error) throw new Error("Não foi possível remover o participante.");
  }

  async transferOwnership(workspaceId: string, profileId: string) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("transfer_workspace_ownership", { p_new_owner_id: profileId, p_workspace_id: workspaceId });
    if (error) throw new Error("Não foi possível transferir a propriedade do controle.");
  }

  async delete(workspaceId: string) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("delete_financial_workspace", { p_workspace_id: workspaceId });
    if (error) throw new Error("Não foi possível excluir o controle financeiro.");
  }
}