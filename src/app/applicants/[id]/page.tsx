"use client";

import { useParams } from 'next/navigation';

import ApplicantDetailView from '@/components/applicants/ApplicantDetailView';

export default function ApplicantDetailPage() {
  const params = useParams();
  const applicantId = params.id as string;

  return (
    <div className="h-full min-h-0 bg-background">
      <ApplicantDetailView applicantId={applicantId} />
    </div>
  );
}
