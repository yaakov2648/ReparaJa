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

const STATUS_CLASS: Record<string, string> = {
  AGUARDA_PAGAMENTO: "bg-orange-soft text-orange",
  EM_CURSO: "bg-orange-soft text-orange",
  CONCLUIDO: "bg-green/15 text-green",
  CANCELADO: "bg-border text-text-2",
};

export default async function TrabalhosClientePage() {
  const user = await requireUser("CLIENTE");

  const jobs = await prisma.job.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { request: { select: { title: true } }, professional: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold">Os teus trabalhos</h1>

        <div className="mt-5 space-y-3">
          {jobs.length === 0 && (
            <p className="rounded-xl bg-surface p-6 text-center text-sm text-text-2 shadow-sm">
              Ainda não contrataste nenhum trabalho.
            </p>
          )}
          {jobs.map((j) => (
            <Link
              key={j.id}
              href={`/cliente/trabalhos/${j.id}`}
              className="block rounded-xl bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{j.request.title}</h2>
                  <p className="text-xs text-text-2">{j.professional.name}</p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[j.status]}`}
                >
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
