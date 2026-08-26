-- CreateEnum types (using DO block to avoid errors if they already exist)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('WORKER', 'CLIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'CLIENT_CONFIRMED', 'DOCUMENT_SUBMITTED', 'FULLY_VERIFIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReviewVisibility" AS ENUM ('PUBLIC', 'NETWORK_ONLY', 'PRIVATE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ConnectionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter User table to use UserRole enum
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";

-- Alter Job table to use enum types (handle defaults)
ALTER TABLE "Job" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Job" ALTER COLUMN "status" TYPE "JobStatus" USING "status"::"JobStatus";
ALTER TABLE "Job" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"JobStatus";

ALTER TABLE "Job" ALTER COLUMN "verificationStatus" DROP DEFAULT;
ALTER TABLE "Job" ALTER COLUMN "verificationStatus" TYPE "VerificationStatus" USING "verificationStatus"::"VerificationStatus";
ALTER TABLE "Job" ALTER COLUMN "verificationStatus" SET DEFAULT 'UNVERIFIED'::"VerificationStatus";

-- Alter Review table to use ReviewVisibility enum (handle default)
ALTER TABLE "Review" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "Review" ALTER COLUMN "visibility" TYPE "ReviewVisibility" USING "visibility"::"ReviewVisibility";
ALTER TABLE "Review" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC'::"ReviewVisibility";

-- Alter ConnectionRequest table to use ConnectionRequestStatus enum (handle default)
ALTER TABLE "ConnectionRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ConnectionRequest" ALTER COLUMN "status" TYPE "ConnectionRequestStatus" USING "status"::"ConnectionRequestStatus";
ALTER TABLE "ConnectionRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"ConnectionRequestStatus";

