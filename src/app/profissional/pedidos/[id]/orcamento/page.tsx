import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { labelFor, SERVICE_CATEGORIES } from "@/lib/constants";

export default async function NovoOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("PROFISSIONAL");
  const { id } = await params;

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { client: { select: { name: true, location: true } } },
  });
  if (!serviceRequest) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-5 rounded-xl bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-orange">
            {labelFor(SERVICE_CATEGORIES, serviceRequest.category)}
          </div>
          <h1 className="mt-1 text-lg font-bold">{serviceRequest.title}</h1>
          {serviceRequest.description && (
            <p className="mt-1 text-sm text-text-2">{serviceRequest.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-2">
            <span>{serviceRequest.client.name}</span>
            {serviceRequest.location && <span>{serviceRequest.location}</span>}
            {(serviceRequest.budgetMin || serviceRequest.budgetMax) && (
              <span>
                Orçamento indicativo: {serviceRequest.budgetMin?.toString() ?? "0"}€ –{" "}
                {serviceRequest.budgetMax?.toString() ?? "?"}€
              </span>
            )}
          </div>
        </div>

        {serviceRequest.status === "ABERTO" ? (
          <QuoteBuilder requestId={serviceRequest.id} />
        ) : (
          <p className="rounded-xl bg-surface p-4 text-sm text-text-2 shadow-sm">
            Este pedido já não está aberto a novos orçamentos.
          </p>
        )}
      </main>
    </div>
  );
}
