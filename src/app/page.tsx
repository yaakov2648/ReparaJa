import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "CLIENTE" ? "/cliente" : "/profissional");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy-3 px-6 text-center text-white">
      <h1 className="text-4xl font-bold">
        Repara<span className="text-orange">Já</span>
      </h1>
      <p className="mt-3 max-w-md text-white/70">
        Obras, remodelações e manutenção. O cliente usa a plataforma de graça — o
        profissional só paga comissão quando fecha um trabalho.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/registar"
          className="rounded-lg bg-orange px-6 py-3 font-semibold text-white hover:brightness-105"
        >
          Criar conta
        </Link>
        <Link
          href="/entrar"
          className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/20"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
