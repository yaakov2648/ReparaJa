import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validation/requests";
import type { ServiceCategory, RequestTiming } from "@/generated/prisma/enums";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (session.role === "PROFISSIONAL") {
    const requests = await prisma.serviceRequest.findMany({
      where: { status: "ABERTO" },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, location: true } },
        quotes: { where: { professionalId: session.sub }, select: { id: true } },
      },
    });
    return NextResponse.json({
      requests: requests.map((r) => ({ ...r, hasQuoted: r.quotes.length > 0, quotes: undefined })),
    });
  }

  const requests = await prisma.serviceRequest.findMany({
    where: { clientId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { quotes: true } } },
  });
  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { title, description, category, location, budgetMin, budgetMax, timing } = parsed.data;

  const created = await prisma.serviceRequest.create({
    data: {
      clientId: session.sub,
      title,
      description: description || null,
      category: category as ServiceCategory,
      location: location || null,
      budgetMin: budgetMin ?? null,
      budgetMax: budgetMax ?? null,
      timing: timing as RequestTiming,
    },
  });

  return NextResponse.json({ request: created }, { status: 201 });
}
