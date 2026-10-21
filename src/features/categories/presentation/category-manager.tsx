"use client";

import { FormEvent, useState, useTransition } from "react";

import { createCategory, deleteCategory, updateCategory } from "@/features/categories/application/category-actions";
import type { Category } from "@/features/categories/domain/category";

const DEFAULT_COLOR = "#2563EB";

type CategoryManagerProperties = {
  categories: Category[];
};

type EditingCategory = Pick<Category, "color" | "icon" | "id" | "name">;

export function CategoryManager({ categories }: CategoryManagerProperties) {
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createCategory({}, formData);
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) form.reset();
    });
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateCategory({}, formData);
      setFeedback(result.error ?? result.success ?? null);
      if (result.success) setEditingCategory(null);
    });
  }

  function remove(category: Category) {
    if (!window.confirm(`Excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.`)) return;

    startTransition(async () => {
      const result = await deleteCategory(category.id);
      setFeedback(result.error ?? result.success ?? null);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <section className="h-fit min-w-0 rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{editingCategory ? "Editar categoria" : "Nova categoria"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use uma cor para facilitar a leitura dos gráficos.</p>
        <form className="mt-5 space-y-4" key={editingCategory?.id ?? "new"} onSubmit={editingCategory ? submitEdit : submitCreate}>
          {editingCategory ? <input name="id" type="hidden" value={editingCategory.id} /> : null}
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="name">
            Nome
            <input className="h-10 rounded-md border bg-background px-3" defaultValue={editingCategory?.name} id="name" maxLength={60} name="name" placeholder="Ex.: Alimentação" required />
          </label>
          <div className="grid grid-cols-[auto_1fr] items-end gap-3">
            <label className="grid gap-1.5 text-sm font-medium" htmlFor="color">
              Cor
              <input className="h-10 w-12 cursor-pointer rounded border bg-background p-1" defaultValue={editingCategory?.color ?? DEFAULT_COLOR} id="color" name="color" required type="color" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium" htmlFor="icon">
              Ícone opcional
              <input className="h-10 rounded-md border bg-background px-3" defaultValue={editingCategory?.icon ?? ""} id="icon" maxLength={40} name="icon" placeholder="Ex.: 🍽️" />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "Salvando..." : editingCategory ? "Salvar alterações" : "Criar categoria"}</button>
            {editingCategory ? <button className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted" disabled={isPending} onClick={() => setEditingCategory(null)} type="button">Cancelar</button> : null}
          </div>
        </form>
        {feedback ? <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{feedback}</p> : null}
      </section>

      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <header className="border-b p-5"><h2 className="text-lg font-semibold">Suas categorias</h2></header>
        {categories.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Nenhuma categoria cadastrada. Crie a primeira ao lado.</p> : <ul className="divide-y">{categories.map((category) => <li className="flex items-center justify-between gap-4 p-4" key={category.id}><div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: category.color }} /><div className="min-w-0"><p className="truncate font-medium">{category.icon ? `${category.icon} ` : ""}{category.name}</p><p className="text-xs text-muted-foreground">{category.color.toUpperCase()}</p></div></div><div className="flex shrink-0 gap-2"><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted" disabled={isPending} onClick={() => setEditingCategory(category)} type="button">Editar</button><button className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950" disabled={isPending} onClick={() => remove(category)} type="button">Excluir</button></div></li>)}</ul>}
      </section>
    </div>
  );
}