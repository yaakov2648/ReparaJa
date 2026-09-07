import { prisma } from "@/lib/prisma";

export type CommissionTierBreakdown = {
  tierId: string;
  from: number;
  to: number | null;
  rate: number;
  amountInTier: number;
  commission: number;
};

export type CommissionResult = {
  applicableAmount: number;
  totalCommission: number;
  effectiveRate: number;
  breakdown: CommissionTierBreakdown[];
};

type TierLike = {
  id: string;
  applicableFrom: { toString(): string } | number;
  applicableUpTo: { toString(): string } | number | null;
  rate: { toString(): string } | number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

export async function getActiveCommissionTiers() {
  return prisma.commissionTier.findMany({
    where: { active: true },
    orderBy: { applicableFrom: "asc" },
  });
}

// Comissão progressiva por escalões: cada escalão incide só sobre a fatia de
// valor dentro do seu intervalo (como IRS por escalões), nunca sobre o total.
// `amount` deve ser o valor sujeito a comissão (subtotal antes de IVA).
export function calculateCommission(amount: number, tiers: TierLike[]): CommissionResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { applicableAmount: 0, totalCommission: 0, effectiveRate: 0, breakdown: [] };
  }

  const breakdown: CommissionTierBreakdown[] = [];
  let totalCommission = 0;

  for (const tier of tiers) {
    const from = Number(tier.applicableFrom);
    const to = tier.applicableUpTo === null ? null : Number(tier.applicableUpTo);
    if (amount <= from) continue;

    const upperBound = to === null ? amount : Math.min(amount, to);
    const amountInTier = upperBound - from;
    if (amountInTier <= 0) continue;

    const rate = Number(tier.rate);
    const commission = round2(amountInTier * rate);
    totalCommission += commission;
    breakdown.push({
      tierId: tier.id,
      from,
      to,
      rate,
      amountInTier: round2(amountInTier),
      commission,
    });
  }

  totalCommission = round2(totalCommission);

  return {
    applicableAmount: round2(amount),
    totalCommission,
    effectiveRate: amount > 0 ? round4(totalCommission / amount) : 0,
    breakdown,
  };
}
