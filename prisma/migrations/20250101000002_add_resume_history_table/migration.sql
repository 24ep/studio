-- CreateTable
CREATE TABLE "ResumeHistory" (
    "id" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_user_id" UUID,
    "uploaded_by_user_name" TEXT,

    CONSTRAINT "ResumeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeHistory_candidateId_idx" ON "ResumeHistory"("candidateId");

-- CreateIndex
CREATE INDEX "ResumeHistory_uploaded_at_idx" ON "ResumeHistory"("uploaded_at");

-- CreateIndex
CREATE INDEX "ResumeHistory_uploaded_by_user_id_idx" ON "ResumeHistory"("uploaded_by_user_id");

-- AddForeignKey
ALTER TABLE "ResumeHistory" ADD CONSTRAINT "ResumeHistory_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeHistory" ADD CONSTRAINT "ResumeHistory_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; 