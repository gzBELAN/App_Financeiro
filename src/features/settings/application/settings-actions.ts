"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = { error?: string; success?: string };
export type ThemePreference = "light" | "dark" | "system";

export async function updateProfile(_: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName || displayName.length > 100) return { error: "Informe um nome entre 1 e 100 caracteres." };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Sua sessão expirou. Entre novamente." };
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    if (error) return { error: "Não foi possível atualizar seu perfil." };
    revalidatePath("/settings");
    return { success: "Perfil atualizado." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." }; }
}

export async function updateThemePreference(theme: ThemePreference): Promise<SettingsActionState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Sua sessão expirou. Entre novamente." };

    const { error } = await supabase
      .from("profiles")
      .update({ theme_preference: theme })
      .eq("id", user.id);

    if (error) return { error: "Não foi possível salvar a preferência de aparência." };

    revalidatePath("/settings");
    return { success: "Preferência de aparência salva." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}
