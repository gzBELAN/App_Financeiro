import { CategoryManager } from "@/features/categories/presentation/category-manager";
import { SupabaseCategoryRepository } from "@/features/categories/infrastructure/supabase-category-repository";

export const metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const categories = await new SupabaseCategoryRepository().list();

  return (
    <main className="container space-y-6 py-8">
      <header>
        <p className="text-sm font-medium text-primary">Organização financeira</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Categorias</h1>
        <p className="mt-2 text-muted-foreground">Classifique suas despesas para entender para onde seu dinheiro está indo.</p>
      </header>
      <CategoryManager categories={categories} />
    </main>
  );
}