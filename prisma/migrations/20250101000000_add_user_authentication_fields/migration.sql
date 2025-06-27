-- AlterTable
ALTER TABLE "User" ADD COLUMN "authentication_method" TEXT DEFAULT 'basic',
ADD COLUMN "force_password_change" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE INDEX "User_authentication_method_idx" ON "User"("authentication_method"); 