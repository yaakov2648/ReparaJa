import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { SimulatedBanner } from "@/components/SimulatedBanner";
import { formatEUR } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  AGUARDA_PAGAMENTO: "Aguarda pagamento do cliente",
  EM_CURSO: "Em curso",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export default async function TrabalhoProfissionalDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("PROFISSIONAL");
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      request: { select: { title: true } },
      client: { select: { name: true } },
      payout: true,
    },
  });
  if (!job || job.professionalId !== user.id) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-xl bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">{job.request.title}</h1>
              <p className="text-sm text-text-2">{job.client.name}</p>
            </div>
            <span className="whitespace-nowrap text-sm font-semibold text-text-2">
              {STATUS_LABEL[job.status]}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-surface p-4 shadow-sm">
          {job.status === "CONCLUIDO" && job.payout ? (
            <>
              <SimulatedBanner text="Payout simulado ao profissional." />
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-2">Valor do trabalho</span>
                  <span>{formatEUR(job.agreedTotal.toString())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-2">Comissão ReparaJá</span>
                  <span>-{formatEUR(job.commissionAmount.toString())}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-navy">
                  <span>Recebeste (simulado)</span>
                  <span>{formatEUR(job.payout.amount.toString())}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1 text-sm text-text-2">
              <div className="flex justify-between">
                <span>Valor do trabalho</span>
                <span>{formatEUR(job.agreedTotal.toString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Comissão ReparaJá (estimada)</span>
                <span>-{formatEUR(job.commissionAmount.toString())}</span>
              </div>
              <p className="pt-2">
                O pagamento fica com o cliente até ele confirmar a conclusão do trabalho.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
