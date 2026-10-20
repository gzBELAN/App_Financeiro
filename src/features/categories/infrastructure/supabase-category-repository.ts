import type { Category, CategoryRepository, CreateCategoryInput, UpdateCategoryInput } from "@/features/categories/domain/category";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
};

export class SupabaseCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, color, icon, created_at")
      .eq("workspace_id", workspace.id)
      .order("name", { ascending: true });

    if (error) {
      throw new Error("Não foi possível carregar as categorias.");
    }

    return (data as CategoryRow[]).map((category) => ({
      color: category.color,
      createdAt: category.created_at,
      icon: category.icon,
      id: category.id,
      name: category.name,
    }));
  }

  async create(input: CreateCategoryInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    }

    const { error } = await supabase.from("categories").insert({
      color: input.color,
      icon: input.icon || null,
      name: input.name,
      user_id: user.id,
      workspace_id: workspace.id,
      created_by_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe uma categoria com este nome.");
      }

      throw new Error("Não foi possível criar a categoria.");
    }
  }

  async update(input: UpdateCategoryInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase
      .from("categories")
      .update({ color: input.color, icon: input.icon || null, name: input.name })
      .eq("id", input.id)
      .eq("workspace_id", workspace.id);

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe uma categoria com este nome.");
      }

      throw new Error("Não foi possível atualizar a categoria.");
    }
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("categories").delete().eq("id", id).eq("workspace_id", workspace.id);

    if (error) {
      if (error.code === "23503") {
        throw new Error("Esta categoria está em uso e não pode ser excluída.");
      }

      throw new Error("Não foi possível excluir a categoria.");
    }
  }
}