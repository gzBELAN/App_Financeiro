import type { ReactNode } from "react";

type AuthCardProperties = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ children, description, title }: AuthCardProperties) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xl shadow-primary/5 backdrop-blur sm:p-8">
        <header className="mb-6 space-y-2">
          <p className="text-sm font-black tracking-[-0.08em] text-primary">Ho.ME <span className="ml-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">House management</span></p>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>
        {children}
      </section>
    </main>
  );
}