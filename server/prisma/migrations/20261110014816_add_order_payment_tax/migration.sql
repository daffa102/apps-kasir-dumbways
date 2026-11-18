/*
  Warnings:

  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotalAmount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxAmount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxRate` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "subtotalAmount" INTEGER NOT NULL,
ADD COLUMN     "taxAmount" INTEGER NOT NULL,
ADD COLUMN     "taxRate" INTEGER NOT NULL,
ALTER COLUMN "cashGiven" DROP NOT NULL,
ALTER COLUMN "changeAmount" DROP NOT NULL;
