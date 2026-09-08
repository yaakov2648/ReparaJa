import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";

export default async function ClienteDashboard() {
  const user = await requireUser("CLIENTE");

  const [openRequests, pendingQuotes] = await Promise.all([
    prisma.serviceRequest.count({ where: { clientId: user.id, status: "ABERTO" } }),
    prisma.quote.count({
      where: { status: "ENVIADO", request: { clientId: user.id, status: "ABERTO" } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Olá, {user.name.split(" ")[0]}</h1>
            <p className="mt-1 text-text-2">
              {openRequests > 0
                ? `Tens ${openRequests} pedido${openRequests === 1 ? "" : "s"} aberto${openRequests === 1 ? "" : "s"} e ${pendingQuotes} proposta${pendingQuotes === 1 ? "" : "s"} por rever.`
                : "Ainda não tens pedidos publicados."}
            </p>
          </div>
          <Link
            href="/cliente/pedidos/novo"
            className="rounded-lg bg-orange px-5 py-2.5 font-semibold text-white"
          >
            + Pedir orçamento
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/cliente/pedidos" className="font-semibold text-orange">
            Ver todos os teus pedidos →
          </Link>
          <Link href="/cliente/trabalhos" className="font-semibold text-orange">
            Os teus trabalhos →
          </Link>
          <Link href="/cliente/mapa" className="font-semibold text-orange">
            Profissionais perto de ti →
          </Link>
          <Link href="/cliente/mensagens" className="font-semibold text-orange">
            Mensagens →
          </Link>
        </div>
      </main>
    </div>
  );
}
