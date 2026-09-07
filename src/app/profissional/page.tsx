import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";

export default async function ProfissionalDashboard() {
  const user = await requireUser("PROFISSIONAL");

  const [openRequests, sentQuotes] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: "ABERTO" } }),
    prisma.quote.count({ where: { professionalId: user.id } }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">Olá, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-text-2">
          {openRequests} pedido{openRequests === 1 ? "" : "s"} aberto{openRequests === 1 ? "" : "s"} na
          plataforma. Já enviaste {sentQuotes} orçamento{sentQuotes === 1 ? "" : "s"}.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/profissional/pedidos"
            className="rounded-lg bg-orange px-5 py-2.5 font-semibold text-white"
          >
            Ver pedidos novos
          </Link>
          <Link
            href="/profissional/orcamentos"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 font-semibold"
          >
            Os teus orçamentos
          </Link>
          <Link
            href="/profissional/trabalhos"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 font-semibold"
          >
            Trabalhos contratados
          </Link>
        </div>
      </main>
    </div>
  );
}
