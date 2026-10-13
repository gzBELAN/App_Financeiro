"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60" disabled={isSubmitting} onClick={handleLogout} type="button">{isSubmitting ? "Saindo..." : "Sair"}</button>;
}