export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-md space-y-3 text-center">
        <p className="text-sm font-semibold text-primary">App Financeiro</p>
        <h1 className="text-3xl font-bold tracking-tight">Você está sem conexão</h1>
        <p className="text-muted-foreground">Reconecte-se à internet para atualizar seus dados financeiros. Os recursos estáticos do aplicativo continuam disponíveis.</p>
      </section>
    </main>
  );
}