-- CreateEnum
CREATE TYPE "ModelName" AS ENUM ('Candidate', 'Position');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "customAttributes" JSONB;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "customAttributes" JSONB DEFAULT '{}',
ALTER COLUMN "department" DROP NOT NULL,
ALTER COLUMN "isOpen" SET DEFAULT true;

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "model" "ModelName" NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "options" TEXT[],
    "placeholder" TEXT,
    "defaultValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "isSystemField" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_model_name_key" ON "CustomFieldDefinition"("model", "name"); 