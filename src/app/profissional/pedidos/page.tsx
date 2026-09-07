import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { labelFor, SERVICE_CATEGORIES } from "@/lib/constants";

export default async function PedidosNovosPage() {
  const user = await requireUser("PROFISSIONAL");

  const requests = await prisma.serviceRequest.findMany({
    where: { status: "ABERTO" },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
      quotes: { where: { professionalId: user.id }, select: { id: true } },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold">Pedidos novos</h1>
        <p className="text-sm text-text-2">Pedidos abertos à espera de orçamento.</p>

        <div className="mt-5 space-y-3">
          {requests.length === 0 && (
            <p className="rounded-xl bg-surface p-6 text-center text-sm text-text-2 shadow-sm">
              Não há pedidos abertos de momento.
            </p>
          )}
          {requests.map((r) => {
            const hasQuoted = r.quotes.length > 0;
            return (
              <div key={r.id} className="rounded-xl bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-orange">
                      {labelFor(SERVICE_CATEGORIES, r.category)}
                    </div>
                    <h2 className="font-semibold">{r.title}</h2>
                    <p className="mt-1 text-xs text-text-2">
                      {r.client.name}
                      {r.location ? ` · ${r.location}` : ""}
                    </p>
                  </div>
                  {(r.budgetMin || r.budgetMax) && (
                    <span className="whitespace-nowrap text-sm font-semibold text-text-2">
                      {r.budgetMin?.toString() ?? "0"}€–{r.budgetMax?.toString() ?? "?"}€
                    </span>
                  )}
                </div>
                <Link
                  href={`/profissional/pedidos/${r.id}/orcamento`}
                  className="mt-3 inline-block rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white"
                >
                  {hasQuoted ? "Enviar novo orçamento" : "Criar orçamento →"}
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
