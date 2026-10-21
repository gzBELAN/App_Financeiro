import { SettingsManager } from "@/features/settings/presentation/settings-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, theme_preference")
    .eq("id", user.id)
    .single();

  return (
    <main className="container space-y-6 py-8">
      <header>
        <p className="text-sm font-medium text-primary">Preferências</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-2 text-muted-foreground">
          Personalize sua conta, aparência e a forma de gerenciar seus controles financeiros.
        </p>
      </header>
      <SettingsManager
        displayName={profile?.display_name ?? user.email ?? ""}
        email={user.email ?? ""}
        themePreference={profile?.theme_preference ?? "system"}
      />
    </main>
  );
}
