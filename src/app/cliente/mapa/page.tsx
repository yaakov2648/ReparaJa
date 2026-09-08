import { requireUser } from "@/lib/require-user";
import { Topbar } from "@/components/Topbar";
import { ProfessionalsMap } from "@/components/ProfessionalsMap";

export default async function MapaPage() {
  const user = await requireUser("CLIENTE");

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold">Profissionais perto de ti</h1>
        <p className="mb-4 text-sm text-text-2">
          Mostra apenas profissionais que já indicaram uma localização.
        </p>
        <ProfessionalsMap />
      </main>
    </div>
  );
}
