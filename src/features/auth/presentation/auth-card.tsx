import type { ReactNode } from "react";

type AuthCardProperties = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ children, description, title }: AuthCardProperties) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <header className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-primary">App Financeiro</p>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>
        {children}
      </section>
    </main>
  );
}