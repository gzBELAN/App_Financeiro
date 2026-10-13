"use server";

import { revalidatePath } from "next/cache";

import { categorySchema } from "@/features/categories/application/category-schema";
import { SupabaseCategoryRepository } from "@/features/categories/infrastructure/supabase-category-repository";

export type CategoryActionState = { error?: string; success?: string };

const repository = new SupabaseCategoryRepository();

function readCategoryInput(formData: FormData) {
  return categorySchema.safeParse({
    color: String(formData.get("color") ?? ""),
    icon: String(formData.get("icon") ?? ""),
    name: String(formData.get("name") ?? ""),
  });
}

function refreshCategories() {
  revalidatePath("/categories");
}

export async function createCategory(_: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  const validation = readCategoryInput(formData);

  if (!validation.success) {
    return { error: validation.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await repository.create(validation.data);
    refreshCategories();
    return { success: "Categoria criada com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

export async function updateCategory(_: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  const id = String(formData.get("id") ?? "");
  const validation = readCategoryInput(formData);

  if (!id || !validation.success) {
    return { error: validation.success ? "Categoria inválida." : validation.error.issues[0]?.message };
  }

  try {
    await repository.update({ id, ...validation.data });
    refreshCategories();
    return { success: "Categoria atualizada com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

export async function deleteCategory(id: string): Promise<CategoryActionState> {
  if (!id) {
    return { error: "Categoria inválida." };
  }

  try {
    await repository.delete(id);
    refreshCategories();
    return { success: "Categoria excluída com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}