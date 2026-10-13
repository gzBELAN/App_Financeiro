import { createBrowserClient } from "@supabase/ssr";

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

export function createClient() {
  const { publishableKey, url } = getSupabaseEnvironment();

  return createBrowserClient(url, publishableKey);
}