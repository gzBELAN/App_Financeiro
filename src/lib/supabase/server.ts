import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "As variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY devem ser configuradas.",
    );
  }

  return { publishableKey, url };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { publishableKey, url } = getSupabaseEnvironment();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => cookieStore.set(name, value, options));
        } catch {
          // Cookies não podem ser alterados durante a renderização de Server Components.
          // O middleware renova a sessão quando necessário.
        }
      },
    },
  });
}