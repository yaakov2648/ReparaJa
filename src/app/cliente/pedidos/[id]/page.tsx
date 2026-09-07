import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { QuoteActions } from "@/components/QuoteActions";
import { formatEUR } from "@/lib/format";
import { labelFor, SERVICE_CATEGORIES } from "@/lib/constants";

const STATUS_LABEL: Record<string, string> = {
  ENVIADO: "Enviado",
  ACEITE: "Aceite",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
};

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("CLIENTE");
  const { id } = await params;

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      quotes: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { orderBy: { position: "asc" } },
          professional: { select: { name: true } },
          job: true,
        },
      },
    },
  });
  if (!serviceRequest || serviceRequest.clientId !== user.id) notFound();

  const conversations = await prisma.conversation.findMany({
    where: { requestId: id },
    select: { id: true, professionalId: true },
  });
  const conversationByProfessional = new Map(conversations.map((c) => [c.professionalId, c.id]));

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-xl bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-orange">
            {labelFor(SERVICE_CATEGORIES, serviceRequest.category)}
          </div>
          <h1 className="mt-1 text-lg font-bold">{serviceRequest.title}</h1>
          {serviceRequest.description && (
            <p className="mt-1 text-sm text-text-2">{serviceRequest.description}</p>
          )}
        </div>

        <h2 className="mb-3 mt-6 font-semibold">
          Propostas recebidas ({serviceRequest.quotes.length})
        </h2>

        <div className="space-y-3">
          {serviceRequest.quotes.length === 0 && (
            <p className="rounded-xl bg-surface p-6 text-center text-sm text-text-2 shadow-sm">
              Ainda não recebeste propostas para este pedido.
            </p>
          )}
          {serviceRequest.quotes.map((q) => (
            <div key={q.id} className="rounded-xl bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{q.professional.name}</h3>
                  <p className="text-xs text-text-2">
                    {STATUS_LABEL[q.status]}
                    {q.validUntil &&
                      ` · válido até ${new Date(q.validUntil).toLocaleDateString("pt-PT")}`}
                  </p>
                </div>
                <span className="text-lg font-bold text-navy">{formatEUR(q.total.toString())}</span>
              </div>

              <ul className="mt-3 divide-y divide-border text-sm">
                {q.items.map((item) => (
                  <li key={item.id} className="flex justify-between py-1.5">
                    <span>
                      {item.description}{" "}
                      <span className="text-text-2">
                        ({item.quantity.toString()} {item.unit})
                      </span>
                    </span>
                    <span>{formatEUR(item.lineTotal.toString())}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-2 space-y-0.5 text-sm text-text-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatEUR(q.subtotal.toString())}</span>
                </div>
                {Number(q.discountAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>Desconto</span>
                    <span>-{formatEUR(q.discountAmount.toString())}</span>
                  </div>
                )}
                {q.vatEnabled && (
                  <div className="flex justify-between">
                    <span>IVA ({(Number(q.vatRate) * 100).toFixed(0)}%)</span>
                    <span>{formatEUR(q.vatAmount.toString())}</span>
                  </div>
                )}
              </div>

              {q.notes && <p className="mt-2 text-sm italic text-text-2">&ldquo;{q.notes}&rdquo;</p>}

              <div className="mt-3 flex flex-wrap gap-2">
                {q.status === "ENVIADO" && serviceRequest.status === "ABERTO" && (
                  <QuoteActions quoteId={q.id} />
                )}
                {conversationByProfessional.has(q.professionalId) && (
                  <Link
                    href={`/cliente/mensagens/${conversationByProfessional.get(q.professionalId)}`}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold"
                  >
                    Conversar
                  </Link>
                )}
              </div>
              {q.job && (
                <Link
                  href={`/cliente/trabalhos/${q.job.id}`}
                  className="mt-3 block rounded-lg bg-orange-soft px-3 py-2 text-sm font-semibold text-orange"
                >
                  Trabalho contratado → ver estado do pagamento (simulado)
                </Link>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
