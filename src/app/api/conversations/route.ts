import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConversationsForUser } from "@/lib/conversations";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const conversations = await getConversationsForUser(session.sub, session.role);
  return NextResponse.json({ conversations });
}
