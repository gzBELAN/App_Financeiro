import type { Expense, ExpenseInput, ExpenseRepository, UpdateExpenseInput } from "@/features/expenses/domain/expense";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspaces/active-workspace";

type ExpenseRow = {
  id: string;
  description: string;
  amount_cents: number;
  occurred_on: string;
  category_id: string | null;
  payment_method: Expense["paymentMethod"];
  notes: string | null;
  status: Expense["status"];
  kind: Expense["kind"];
  installment_purchase_id: string | null;
  installment_number: number | null;
  installment_count: number | null;
  categories: { name: string; color: string } | null;
};

function writeErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "42501") return "Você não tem permissão para registrar lançamentos neste controle financeiro.";
  if (error.code === "23502") return "O banco de dados ainda não está atualizado para registrar lançamentos. Aplique a migração de controle compartilhado no Supabase.";
  if (error.code === "23514") return "Os dados do lançamento são incompatíveis. Lançamentos comuns não podem usar cartão de crédito; use Parcelamentos ou Assinaturas para isso.";
  if (error.code === "PGRST204" || error.code === "42703") return "O banco de dados não reconhece os campos do controle compartilhado. Aplique ou atualize a migração no Supabase.";
  return `Não foi possível registrar o lançamento: ${error.message}`;
}

export class SupabaseExpenseRepository implements ExpenseRepository {
  async list(): Promise<Expense[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase
      .from("financial_entries")
      .select("id, description, amount_cents, occurred_on, category_id, payment_method, notes, status, kind, installment_purchase_id, installment_number, installment_count, categories(name, color)")
      .eq("workspace_id", workspace.id)
      .is("recurring_rule_id", null)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error("Não foi possível carregar as despesas.");

    return (data as unknown as ExpenseRow[]).map((expense) => ({
      amountCents: expense.amount_cents,
      categoryColor: expense.categories?.color ?? null,
      categoryId: expense.category_id,
      categoryName: expense.categories?.name ?? null,
      description: expense.description,
      id: expense.id,
      kind: expense.kind,
      installmentPurchaseId: expense.installment_purchase_id,
      installmentNumber: expense.installment_number,
      installmentCount: expense.installment_count,
      notes: expense.notes,
      occurredOn: expense.occurred_on,
      paymentMethod: expense.payment_method,
      status: expense.status,
    }));
  }

  async create(input: ExpenseInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sua sessão expirou. Entre novamente para continuar.");

    const { error } = await supabase.from("financial_entries").insert({
      amount_cents: input.amountCents,
      category_id: input.categoryId || null,
      description: input.description,
      kind: input.kind,
      notes: input.notes || null,
      occurred_on: input.occurredOn,
      payment_method: input.paymentMethod,
      status: input.status,
      user_id: user.id,
      workspace_id: workspace.id,
      created_by_id: user.id,
    });

    if (error) throw new Error(writeErrorMessage(error));
  }

  async update(input: UpdateExpenseInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("financial_entries").update({
      amount_cents: input.amountCents,
      category_id: input.categoryId || null,
      description: input.description,
      kind: input.kind,
      notes: input.notes || null,
      occurred_on: input.occurredOn,
      payment_method: input.paymentMethod,
      status: input.status,
    }).eq("id", input.id).eq("workspace_id", workspace.id);

    if (error) throw new Error(writeErrorMessage(error));
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("financial_entries").delete().eq("id", id).eq("workspace_id", workspace.id);
    if (error) throw new Error(writeErrorMessage(error));
  }
}