import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Applicant Evaluation | hrive',
  description: 'Review attachments, score applicants, and complete structured interview evaluations.',
};

export default function ApplicantEvaluateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
