import type { ScreeningIdentity, ScreeningSourceResult } from './types';

const RISK_TERMS = ['complaint harassment fraud threat misconduct', 'ร้องเรียน คุกคาม ฉ้อโกง ทุจริต'];

export function buildScreeningQueries(identity: ScreeningIdentity, maximum = 5) {
  const context = [identity.employers[0], identity.location, identity.education[0]].filter(Boolean).map(value => `"${value}"`).join(' ');
  const queries = [
    ...RISK_TERMS.map(terms => `"${identity.name}" ${context} ${terms}`),
    `site:linkedin.com/in "${identity.name}" ${context}`,
    `site:facebook.com "${identity.name}" ${context}`,
    `site:x.com "${identity.name}" ${context}`,
  ];
  return [...new Set(queries)].slice(0, maximum);
}

export async function searchBrave(query: string, count: number, key: string | null): Promise<ScreeningSourceResult[]> {
  if (!key) return [];
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(count));
  url.searchParams.set('safesearch', 'moderate');
  const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Subscription-Token': key }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Brave search failed (${response.status})`);
  const payload = await response.json() as { web?: { results?: Array<{ url?: string; title?: string; description?: string; profile?: { long_name?: string } }> } };
  return (payload.web?.results || []).flatMap(item => item.url ? [{ sourceType: 'brave', url: item.url, title: item.title || item.url, publisher: item.profile?.long_name, snippet: item.description }] : []);
}

export async function searchGdelt(query: string, count: number): Promise<ScreeningSourceResult[]> {
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('maxrecords', String(Math.min(count, 25)));
  url.searchParams.set('format', 'json');
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`GDELT search failed (${response.status})`);
  const payload = await response.json() as { articles?: Array<{ url?: string; title?: string; domain?: string; seendate?: string }> };
  return (payload.articles || []).flatMap(item => item.url ? [{ sourceType: 'gdelt', url: item.url, title: item.title || item.url, publisher: item.domain, publishedAt: item.seendate }] : []);
}

const officialCache = new Map<string, { expiresAt: number; body: string }>();
async function fetchOfficialText(url: string) {
  const cached = officialCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.body;
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Official source failed (${response.status})`);
  const body = await response.text();
  officialCache.set(url, { body, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return body;
}

export async function searchOfficialLists(identity: ScreeningIdentity, enabledSources: string[]): Promise<ScreeningSourceResult[]> {
  const sources = [
    { type: 'un_sanctions', url: 'https://main.un.org/securitycouncil/sites/default/files/combined.xml', title: 'UN Security Council Consolidated Sanctions List' },
    { type: 'ofac_sdn', url: 'https://ofac.treasury.gov/downloads/sdn.csv', title: 'OFAC Specially Designated Nationals List' },
    { type: 'uk_sanctions', url: 'https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv', title: 'UK Sanctions List' },
  ].filter(source => enabledSources.includes(source.type === 'un_sanctions' ? 'un' : source.type === 'ofac_sdn' ? 'ofac' : 'uk'));
  const names = [identity.name, ...identity.aliases].map(value => value.trim().toLowerCase()).filter(value => value.length > 3);
  const settled = await Promise.allSettled(sources.map(async source => ({ source, body: (await fetchOfficialText(source.url)).toLowerCase() })));
  const matches = settled.flatMap(item => item.status === 'fulfilled' && names.some(name => item.value.body.includes(name)) ? [{ sourceType: item.value.source.type, url: item.value.source.url, title: `${item.value.source.title}: possible name match`, publisher: item.value.source.title, snippet: `${identity.name} appears in an official list. Identity requires corroboration.` }] : []);
  try {
    if (!enabledSources.includes('thai_sec')) return matches;
    const thaiSecUrl = new URL('https://secsearch.sec.or.th/');
    thaiSecUrl.searchParams.set('rawSearch', identity.name);
    thaiSecUrl.searchParams.set('search', identity.name);
    thaiSecUrl.searchParams.append('type[]', 'system_name:Enforcement');
    const body = (await fetchOfficialText(thaiSecUrl.toString())).toLowerCase();
    if (names.some(name => body.includes(name)) && /enforcement|criminal complaint|ดำเนินคดี|กล่าวโทษ/i.test(body)) {
      matches.push({ sourceType: 'thai_sec_enforcement', url: thaiSecUrl.toString(), title: `Thai SEC enforcement search: possible match for ${identity.name}`, publisher: 'Securities and Exchange Commission, Thailand', snippet: `${identity.name} appears in Thai SEC enforcement search results. Identity requires corroboration.` });
    }
  } catch { /* A single official source must not fail the screening case. */ }
  return matches;
}
