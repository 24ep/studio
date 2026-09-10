export function buildPipelineCounts(items?: Array<{ stage?: string; recruiter?: string; count: number }>) {
  const counts: Record<string, number> = {};

  for (const item of items || []) {
    const key = item.stage || item.recruiter;
    if (key) counts[key] = item.count;
  }

  return counts;
}
