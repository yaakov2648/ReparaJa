import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { formatEUR } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  AGUARDA_PAGAMENTO: "Aguarda pagamento",
  EM_CURSO: "Em curso",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export default async function TrabalhosProfissionalPage() {
  const user = await requireUser("PROFISSIONAL");

  const jobs = await prisma.job.findMany({
    where: { professionalId: user.id },
    orderBy: { createdAt: "desc" },
    include: { request: { select: { title: true } }, client: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold">Trabalhos contratados</h1>

        <div className="mt-5 space-y-3">
          {jobs.length === 0 && (
            <p className="rounded-xl bg-surface p-6 text-center text-sm text-text-2 shadow-sm">
              Ainda não tens trabalhos contratados.
            </p>
          )}
          {jobs.map((j) => (
            <Link
              key={j.id}
              href={`/profissional/trabalhos/${j.id}`}
              className="block rounded-xl bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{j.request.title}</h2>
                  <p className="text-xs text-text-2">{j.client.name}</p>
                </div>
                <span className="whitespace-nowrap text-xs font-semibold text-text-2">
                  {STATUS_LABEL[j.status]}
                </span>
              </div>
              <div className="mt-2 font-bold text-navy">{formatEUR(j.agreedTotal.toString())}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
