import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "PROFISSIONAL") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const quotes = await prisma.quote.findMany({
    where: { professionalId: session.sub },
    include: { request: { select: { title: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ quotes });
}
