export function SimulatedBanner({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      🧪 MODO SIMULADO — {text} Nenhum dinheiro real é movimentado.
    </div>
  );
}
