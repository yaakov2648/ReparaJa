import { requireUser } from "@/lib/require-user";
import { Topbar } from "@/components/Topbar";
import { NovoPedidoForm } from "@/components/NovoPedidoForm";

export default async function NovoPedidoPage() {
  const user = await requireUser("CLIENTE");

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <NovoPedidoForm />
    </div>
  );
}
