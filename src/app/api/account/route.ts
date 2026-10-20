import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "A exclusão de conta requer SUPABASE_SERVICE_ROLE_KEY configurada somente no servidor." }, { status: 503 });

  const { error: dataError } = await supabase.rpc("delete_my_account_data");
  if (dataError) return NextResponse.json({ error: "Não foi possível remover os dados da conta." }, { status: 400 });

  const admin = createAdminClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return NextResponse.json({ error: "Os dados foram removidos, mas não foi possível excluir a autenticação." }, { status: 500 });

  return NextResponse.json({ success: true });
}
