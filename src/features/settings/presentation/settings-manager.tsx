"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  type ThemePreference,
  updateProfile,
  updateThemePreference,
} from "@/features/settings/application/settings-actions";
import { createClient } from "@/lib/supabase/client";

type SettingsManagerProperties = {
  displayName: string;
  email: string;
  themePreference: ThemePreference;
};

function applyTheme(preference: ThemePreference) {
  const useDarkTheme =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", useDarkTheme);
}

export function SettingsManager({
  displayName,
  email,
  themePreference,
}: SettingsManagerProperties) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(themePreference);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const storedTheme = localStorage.getItem("app-financeiro-theme") as ThemePreference | null;
    const preference = storedTheme ?? themePreference;
    setTheme(preference);
    applyTheme(preference);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const synchronizeSystemTheme = () => {
      if (preference === "system") applyTheme("system");
    };
    media.addEventListener("change", synchronizeSystemTheme);
    return () => media.removeEventListener("change", synchronizeSystemTheme);
  }, [themePreference]);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateProfile({}, new FormData(event.currentTarget));
      setFeedback(result.error ?? result.success ?? null);
    });
  }

  function setVisualTheme(preference: ThemePreference) {
    setTheme(preference);
    applyTheme(preference);
    localStorage.setItem("app-financeiro-theme", preference);
    startTransition(async () => {
      const result = await updateThemePreference(preference);
      setFeedback(result.error ?? result.success ?? null);
    });
  }

  async function deleteAccount() {
    if (!window.confirm("Excluir sua conta removerá seus controles próprios e o acesso a controles compartilhados. Deseja continuar?")) return;
    if (window.prompt("Digite EXCLUIR para confirmar a exclusão definitiva.") !== "EXCLUIR") return;

    setFeedback("Excluindo conta...");
    const response = await fetch("/api/account", { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setFeedback(payload.error ?? "Não foi possível excluir a conta.");
      return;
    }

    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Conta: {email}</p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={saveProfile}>
          <input className="h-10 flex-1 rounded-md border bg-background px-3" defaultValue={displayName} maxLength={100} name="displayName" required />
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" disabled={isPending} type="submit">Salvar</button>
        </form>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Aparência</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sua escolha é sincronizada à conta e aplicada neste dispositivo.</p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Escolha de tema">
          {(["light", "dark", "system"] as const).map((value) => (
            <button
              aria-pressed={theme === value}
              className={`rounded-md border px-4 py-2 text-sm ${theme === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              disabled={isPending}
              key={value}
              onClick={() => setVisualTheme(value)}
              type="button"
            >
              {value === "light" ? "Claro" : value === "dark" ? "Escuro" : "Sistema"}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-red-200 bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-red-700">Zona de perigo</h2>
        <p className="mt-1 text-sm text-muted-foreground">A exclusão é definitiva. Seus controles próprios e dados serão apagados; controles compartilhados apenas perderão seu acesso.</p>
        <button className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" onClick={deleteAccount} type="button">Excluir minha conta</button>
      </section>

      {feedback ? <p aria-live="polite" className="text-sm text-muted-foreground">{feedback}</p> : null}
    </div>
  );
}
