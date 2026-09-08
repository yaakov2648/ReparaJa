import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { labelFor, SERVICE_CATEGORIES } from "@/lib/constants";

const STATUS_LABEL: Record<string, string> = {
  ABERTO: "Aberto",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
};

export default async function PedidosClientePage() {
  const user = await requireUser("CLIENTE");

  const requests = await prisma.serviceRequest.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { quotes: true } } },
  });

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Os teus pedidos</h1>
          <Link
            href="/cliente/pedidos/novo"
            className="rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white"
          >
            + Novo pedido
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {requests.length === 0 && (
            <p className="rounded-xl bg-surface p-6 text-center text-sm text-text-2 shadow-sm">
              Ainda não publicaste nenhum pedido.
            </p>
          )}
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/cliente/pedidos/${r.id}`}
              className="block rounded-xl bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-orange">
                    {labelFor(SERVICE_CATEGORIES, r.category)}
                  </div>
                  <h2 className="font-semibold">{r.title}</h2>
                </div>
                <span className="whitespace-nowrap text-xs font-semibold text-text-2">
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-2">
                {r._count.quotes} orçamento{r._count.quotes === 1 ? "" : "s"} recebido
                {r._count.quotes === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
