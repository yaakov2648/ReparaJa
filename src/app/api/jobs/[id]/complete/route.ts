import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentService } from "@/lib/payments";
import { toClientSafeJob } from "@/lib/serialize";

// O cliente confirma que o trabalho foi concluído. Isto liberta o payout
// (simulado) ao profissional — no mundo real, com Stripe Connect, esta seria
// a transferência efetiva menos a comissão retida pela ReparaJá.
export async function POST(_request: Request, ctx: RouteContext<"/api/jobs/[id]/complete">) {
  const session = await getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id: jobId } = await ctx.params;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (job.clientId !== session.sub) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (job.status !== "EM_CURSO") {
    return NextResponse.json({ error: "job_not_in_progress" }, { status: 409 });
  }

  const updatedJob = await prisma.job.update({ where: { id: jobId }, data: { status: "CONCLUIDO" } });

  const payoutAmount = Number(job.agreedTotal) - Number(job.commissionAmount);
  const payout = await paymentService.createPayout({
    jobId: job.id,
    professionalId: job.professionalId,
    amount: payoutAmount,
  });
  await paymentService.releasePayout(payout.id);

  // Cliente nunca vê a comissão nem o valor líquido do profissional (dá para
  // deduzir a comissão por subtração) — só a confirmação de que concluiu.
  return NextResponse.json({ job: toClientSafeJob(updatedJob) });
}
