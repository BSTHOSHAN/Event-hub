-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_signedOffById_fkey";

-- AddColumns (old columns kept temporarily for backfill)
ALTER TABLE "Attendance"
  ADD COLUMN     "confirmedAt" TIMESTAMP(3),
  ADD COLUMN     "confirmedById" TEXT,
  ADD COLUMN     "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN     "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill: existing direct sign-offs become confirmed attendance records
UPDATE "Attendance" SET
  "status" = 'CONFIRMED',
  "requestedAt" = "signedOffAt",
  "confirmedAt" = "signedOffAt",
  "confirmedById" = "signedOffById";

-- DropColumns (old sign-off fields, now migrated)
ALTER TABLE "Attendance"
  DROP COLUMN "signedOffAt",
  DROP COLUMN "signedOffById";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "coinValue" INTEGER NOT NULL DEFAULT 10;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
