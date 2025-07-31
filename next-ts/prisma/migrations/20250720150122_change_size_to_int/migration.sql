/*
  Warnings:

  - The `size` column on the `Document` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "key" TEXT,
DROP COLUMN "size",
ADD COLUMN     "size" INTEGER;
