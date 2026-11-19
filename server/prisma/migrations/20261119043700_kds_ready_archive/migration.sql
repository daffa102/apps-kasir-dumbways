-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'READY';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "kdsArchivedAt" TIMESTAMP(3);
