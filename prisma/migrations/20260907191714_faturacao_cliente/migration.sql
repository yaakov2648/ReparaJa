-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingNif" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "wantsInvoice" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingNif" TEXT,
ADD COLUMN     "billingPostalCode" TEXT;
