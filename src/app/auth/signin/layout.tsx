import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | hrive',
  description: 'Authenticate to access the hrive recruitment platform.',
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
