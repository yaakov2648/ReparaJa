export const SERVICE_CATEGORIES = [
  { value: "REMODELACAO", label: "Remodelação" },
  { value: "PINTURA", label: "Pintura" },
  { value: "CANALIZACAO", label: "Canalização" },
  { value: "ELETRICIDADE", label: "Eletricidade" },
  { value: "CARPINTARIA", label: "Carpintaria" },
  { value: "PAVIMENTO", label: "Pavimentos" },
  { value: "COZINHA", label: "Cozinhas" },
  { value: "CASA_BANHO", label: "Casas de banho" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const REQUEST_TIMINGS = [
  { value: "ESTA_SEMANA", label: "Esta semana" },
  { value: "PROXIMAS_DUAS_SEMANAS", label: "Próximas 2 semanas" },
  { value: "ESTE_MES", label: "Este mês" },
  { value: "SEM_URGENCIA", label: "Sem urgência" },
] as const;

// Linhas predefinidas de orçamento — tocar num chip acrescenta logo a linha,
// para o profissional montar um orçamento em poucos minutos no telemóvel.
export const QUOTE_ITEM_TYPES = [
  { value: "MAO_DE_OBRA", label: "Mão de obra", unit: "h" },
  { value: "DESLOCACAO", label: "Deslocação", unit: "vg" },
  { value: "MATERIAIS", label: "Materiais", unit: "un" },
  { value: "DEMOLICAO", label: "Demolição", unit: "un" },
  { value: "PREPARACAO", label: "Preparação", unit: "un" },
  { value: "INSTALACAO", label: "Instalação", unit: "un" },
  { value: "TRANSPORTE", label: "Transporte", unit: "vg" },
  { value: "LIMPEZA", label: "Limpeza", unit: "un" },
  { value: "ALUGUER_EQUIPAMENTO", label: "Aluguer de equipamento", unit: "dia" },
  { value: "OUTRO", label: "Outro", unit: "un" },
] as const;

export type ServiceCategoryValue = (typeof SERVICE_CATEGORIES)[number]["value"];
export type QuoteItemTypeValue = (typeof QUOTE_ITEM_TYPES)[number]["value"];

export function labelFor<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string
): string {
  return list.find((i) => i.value === value)?.label ?? value;
}
