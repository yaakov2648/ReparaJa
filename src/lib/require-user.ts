import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/enums";

export async function requireUser(role?: UserRole) {
  const session = await getSession();
  if (!session) {
    redirect("/entrar");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, phone: true, location: true },
  });
  if (!user) {
    redirect("/entrar");
  }
  if (role && user.role !== role) {
    redirect(user.role === "CLIENTE" ? "/cliente" : "/profissional");
  }
  return user;
}
