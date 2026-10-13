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
  categories: { name: string; color: string } | null;
};

export class SupabaseExpenseRepository implements ExpenseRepository {
  async list(): Promise<Expense[]> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { data, error } = await supabase
      .from("financial_entries")
      .select("id, description, amount_cents, occurred_on, category_id, payment_method, notes, status, categories(name, color)")
      .eq("kind", "expense")
      .eq("workspace_id", workspace.id)
      .is("installment_purchase_id", null)
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
      kind: "expense",
      notes: input.notes || null,
      occurred_on: input.occurredOn,
      payment_method: input.paymentMethod,
      status: input.status,
      workspace_id: workspace.id,
      created_by_id: user.id,
    });

    if (error) throw new Error("Não foi possível registrar a despesa.");
  }

  async update(input: UpdateExpenseInput): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("financial_entries").update({
      amount_cents: input.amountCents,
      category_id: input.categoryId || null,
      description: input.description,
      notes: input.notes || null,
      occurred_on: input.occurredOn,
      payment_method: input.paymentMethod,
      status: input.status,
    }).eq("id", input.id).eq("kind", "expense").eq("workspace_id", workspace.id);

    if (error) throw new Error("Não foi possível atualizar a despesa.");
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const workspace = await getActiveWorkspace();
    const { error } = await supabase.from("financial_entries").delete().eq("id", id).eq("kind", "expense").eq("workspace_id", workspace.id);
    if (error) throw new Error("Não foi possível excluir a despesa.");
  }
}