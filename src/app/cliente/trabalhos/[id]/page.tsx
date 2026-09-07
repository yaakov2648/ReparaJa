import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { SimulatedBanner } from "@/components/SimulatedBanner";
import { PaymentSimulationActions, CompleteJobAction } from "@/components/JobActions";
import { formatEUR } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  AGUARDA_PAGAMENTO: "Aguarda pagamento",
  EM_CURSO: "Em curso",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export default async function TrabalhoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("CLIENTE");
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      request: { select: { title: true } },
      professional: { select: { name: true } },
      payment: true,
      payout: true,
    },
  });
  if (!job || job.clientId !== user.id) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-xl bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">{job.request.title}</h1>
              <p className="text-sm text-text-2">{job.professional.name}</p>
            </div>
            <span className="whitespace-nowrap text-sm font-semibold text-text-2">
              {STATUS_LABEL[job.status]}
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-navy">
            {formatEUR(job.agreedTotal.toString())}
          </div>
        </div>

        {job.status === "AGUARDA_PAGAMENTO" && job.payment && job.payment.status === "PENDENTE" && (
          <div className="mt-4 space-y-3 rounded-xl bg-surface p-4 shadow-sm">
            <SimulatedBanner text="Este pagamento é uma simulação do fluxo real (Stripe Connect, Fase seguinte)." />
            <p className="text-sm text-text-2">
              No mundo real, aqui apareceria o checkout do processador de pagamentos. Usa os
              botões abaixo para simular o resultado.
            </p>
            <PaymentSimulationActions paymentId={job.payment.id} />
          </div>
        )}

        {job.payment?.status === "FALHADO" && (
          <div className="mt-4 rounded-xl bg-red/10 p-4 text-sm text-red shadow-sm">
            O pagamento simulado falhou. (Repetir pagamento fica para uma fase seguinte.)
          </div>
        )}

        {job.status === "EM_CURSO" && (
          <div className="mt-4 space-y-3 rounded-xl bg-surface p-4 shadow-sm">
            <SimulatedBanner text="Pagamento confirmado (simulado)." />
            <p className="text-sm text-text-2">
              Quando o trabalho estiver mesmo concluído, confirma abaixo. Isto liberta o
              pagamento (simulado) ao profissional, descontada a comissão ReparaJá.
            </p>
            <CompleteJobAction jobId={job.id} />
          </div>
        )}

        {job.status === "CONCLUIDO" && job.payout && (
          <div className="mt-4 rounded-xl bg-surface p-4 shadow-sm">
            <SimulatedBanner text="Trabalho concluído e pagamento processado ao profissional." />
            <div className="mt-3 flex justify-between text-sm font-semibold">
              <span>Total pago</span>
              <span>{formatEUR(job.agreedTotal.toString())}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
