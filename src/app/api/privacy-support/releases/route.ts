import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import packageJson from '../../../../../package.json';

type Release = { version: string; date: string | null; sections: { title: string; items: string[] }[] };

function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = [];
  let release: Release | null = null;
  let section: { title: string; items: string[] } | null = null;
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    const releaseMatch = line.match(/^## \[([^\]]+)\](?: - (.+))?$/);
    if (releaseMatch) {
      release = { version: releaseMatch[1], date: releaseMatch[2] || null, sections: [] };
      releases.push(release);
      section = null;
      continue;
    }
    const sectionMatch = line.match(/^### (.+)$/);
    if (sectionMatch && release) {
      section = { title: sectionMatch[1].replace(/[^\w &/()-]/g, '').trim(), items: [] };
      release.sections.push(section);
      continue;
    }
    if (line.startsWith('- ') && section) section.items.push(line.slice(2).replace(/\*\*/g, '').trim());
  }
  return releases.slice(0, 20);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const markdown = await readFile(path.join(process.cwd(), 'CHANGELOG.md'), 'utf8');
    return NextResponse.json({ version: packageJson.version, releases: parseChangelog(markdown) });
  } catch {
    return NextResponse.json({ version: packageJson.version, releases: [] });
  }
}
