import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";
import { labelFor, SERVICE_CATEGORIES } from "@/lib/constants";

const DEFAULT_RADIUS_KM = 50;
const MAX_RADIUS_KM = 150;
const MAX_RESULTS = 50;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radiusKm = Math.min(
    Number(searchParams.get("radiusKm")) || DEFAULT_RADIUS_KM,
    MAX_RADIUS_KM
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
  }

  const profiles = await prisma.professionalProfile.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    include: { user: { select: { id: true, name: true, location: true } } },
  });

  // Categorias em que o profissional já trabalhou de facto (orçamentos
  // aceites) — nunca inventadas, refletem trabalho real na plataforma.
  const acceptedQuotes = await prisma.quote.findMany({
    where: { status: "ACEITE" },
    select: { professionalId: true, request: { select: { category: true } } },
  });
  const categoriesByProfessional = new Map<string, Set<string>>();
  for (const q of acceptedQuotes) {
    const set = categoriesByProfessional.get(q.professionalId) ?? new Set<string>();
    set.add(q.request.category);
    categoriesByProfessional.set(q.professionalId, set);
  }

  const completedCounts = await prisma.job.groupBy({
    by: ["professionalId"],
    where: { status: "CONCLUIDO" },
    _count: { _all: true },
  });
  const completedByProfessional = new Map(
    completedCounts.map((c) => [c.professionalId, c._count._all])
  );

  const nearby = profiles
    .map((p) => {
      const distanceKm = haversineDistanceKm(
        { latitude: lat, longitude: lng },
        { latitude: p.latitude!, longitude: p.longitude! }
      );
      const categories = Array.from(categoriesByProfessional.get(p.userId) ?? []).map((c) =>
        labelFor(SERVICE_CATEGORIES, c)
      );
      return {
        userId: p.userId,
        name: p.user.name,
        location: p.user.location,
        latitude: p.latitude,
        longitude: p.longitude,
        distanceKm: Math.round(distanceKm * 10) / 10,
        categories,
        completedJobs: completedByProfessional.get(p.userId) ?? 0,
      };
    })
    .filter((p) => p.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_RESULTS);

  return NextResponse.json({ professionals: nearby });
}
