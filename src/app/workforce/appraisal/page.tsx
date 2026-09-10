import { redirect } from 'next/navigation';

export default async function AppraisalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const legacyParams = await searchParams;
  const target = new URLSearchParams({ tab: 'appraisal' });
  for (const [key, rawValue] of Object.entries(legacyParams)) {
    const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
    const targetKey = key === 'tab' ? 'appraisalTab' : key;
    values.forEach(value => target.append(targetKey, value));
  }

  redirect(`/workforce/performance?${target.toString()}`);
}
