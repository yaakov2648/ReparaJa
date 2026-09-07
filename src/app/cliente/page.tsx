import { requireUser } from "@/lib/require-user";
import { Topbar } from "@/components/Topbar";

export default async function ClienteDashboard() {
  const user = await requireUser("CLIENTE");

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">Olá, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-text-2">
          A tua conta de cliente está criada. As funcionalidades de pedir orçamento,
          ver propostas e acompanhar obras chegam nas próximas fases.
        </p>
        <div className="mt-8 rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="font-semibold">Próximos passos</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-text-2">
            <li>Pedidos de orçamento com linhas detalhadas</li>
            <li>Propostas reais de profissionais</li>
            <li>Pagamento via Stripe Connect</li>
            <li>Chat com histórico auditável</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
