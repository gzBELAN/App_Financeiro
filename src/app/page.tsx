export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-xl space-y-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">App Financeiro</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Estrutura inicial configurada
        </h1>
        <p className="text-muted-foreground">
          As telas de autenticação e controle financeiro serão implementadas nas próximas etapas.
        </p>
      </section>
    </main>
  );
}