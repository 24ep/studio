-- CreateTable
CREATE TABLE "JobMatch" (
    "id" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "jobId" TEXT,
    "job_title" TEXT,
    "fit_score" INTEGER,
    "match_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "job_description_summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobMatch_candidateId_idx" ON "JobMatch"("candidateId");

-- CreateIndex
CREATE INDEX "JobMatch_jobId_idx" ON "JobMatch"("jobId");

-- CreateIndex
CREATE INDEX "JobMatch_fit_score_idx" ON "JobMatch"("fit_score");

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE; 