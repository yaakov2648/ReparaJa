import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { formatEUR } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  ENVIADO: "Enviado",
  ACEITE: "Aceite",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
};

const STATUS_CLASS: Record<string, string> = {
  ENVIADO: "bg-orange-soft text-orange",
  ACEITE: "bg-green/15 text-green",
  RECUSADO: "bg-red/10 text-red",
  EXPIRADO: "bg-border text-text-2",
};

export default async function OrcamentosPage() {
  const user = await requireUser("PROFISSIONAL");

  const quotes = await prisma.quote.findMany({
    where: { professionalId: user.id },
    include: { request: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold">Os teus orçamentos</h1>

        <div className="mt-5 space-y-3">
          {quotes.length === 0 && (
            <p className="rounded-xl bg-surface p-6 text-center text-sm text-text-2 shadow-sm">
              Ainda não enviaste nenhum orçamento.
            </p>
          )}
          {quotes.map((q) => (
            <div key={q.id} className="rounded-xl bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{q.request.title}</h2>
                  <p className="mt-1 text-xs text-text-2">
                    {new Date(q.createdAt).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[q.status]}`}
                >
                  {STATUS_LABEL[q.status]}
                </span>
              </div>
              <div className="mt-2 text-lg font-bold text-navy">{formatEUR(q.total.toString())}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
