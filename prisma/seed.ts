import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Escalões de comissão progressiva definidos no modelo de negócio.
// Cada escalão aplica-se apenas à fatia de valor dentro do intervalo.
const TIERS = [
  { applicableFrom: "0", applicableUpTo: "500", rate: "0.10" },
  { applicableFrom: "500", applicableUpTo: "2000", rate: "0.08" },
  { applicableFrom: "2000", applicableUpTo: "5000", rate: "0.06" },
  { applicableFrom: "5000", applicableUpTo: "10000", rate: "0.04" },
  { applicableFrom: "10000", applicableUpTo: null, rate: "0.03" },
];

async function main() {
  const existing = await prisma.commissionTier.count();
  if (existing > 0) {
    console.log("commission_tiers já tem dados, a saltar seed.");
    return;
  }
  await prisma.commissionTier.createMany({ data: TIERS });
  console.log(`Criados ${TIERS.length} escalões de comissão.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
