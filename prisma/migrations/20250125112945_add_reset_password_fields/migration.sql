-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordTokenExpiration" TIMESTAMP(3);
