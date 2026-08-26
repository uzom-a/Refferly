-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN "fullAddress" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN "latitude" REAL;
ALTER TABLE "ClientProfile" ADD COLUMN "longitude" REAL;

-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN "fullAddress" TEXT;
ALTER TABLE "WorkerProfile" ADD COLUMN "latitude" REAL;
ALTER TABLE "WorkerProfile" ADD COLUMN "longitude" REAL;
