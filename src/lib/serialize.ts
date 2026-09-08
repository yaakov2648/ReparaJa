// A comissão ReparaJá é informação do profissional e da plataforma, nunca do
// cliente. Qualquer resposta de API acionada pelo cliente tem de passar o
// Job por aqui antes de ir para o corpo da resposta — não chega esconder o
// valor no ecrã, o JSON em si não pode conter os campos.
export function toClientSafeJob<
  T extends {
    commissionApplicableAmount: unknown;
    commissionAmount: unknown;
    commissionBreakdown: unknown;
  },
>(job: T): Omit<T, "commissionApplicableAmount" | "commissionAmount" | "commissionBreakdown"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { commissionApplicableAmount, commissionAmount, commissionBreakdown, ...safe } = job;
  return safe;
}
