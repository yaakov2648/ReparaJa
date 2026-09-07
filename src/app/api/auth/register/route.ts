import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { name, email, password, role, phone, location } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "email_in_use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      phone: phone || null,
      location: location || null,
      ...(role === "PROFISSIONAL" ? { professionalProfile: { create: {} } } : {}),
    },
  });

  const token = await createSessionToken({ sub: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
