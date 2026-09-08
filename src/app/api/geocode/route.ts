import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { geocodeLocation } from "@/lib/geocoding";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ error: "query_too_short" }, { status: 400 });
  }

  const result = await geocodeLocation(q);
  if (!result) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ result });
}
