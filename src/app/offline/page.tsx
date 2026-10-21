export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-md space-y-3 text-center">
        <p className="text-sm font-black tracking-[-0.08em] text-primary">Ho.ME <span className="ml-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">House management</span></p>
        <h1 className="text-3xl font-bold tracking-tight">Você está sem conexão</h1>
        <p className="text-muted-foreground">Reconecte-se à internet para atualizar seus dados financeiros. Os recursos estáticos do aplicativo continuam disponíveis.</p>
      </section>
    </main>
  );
}