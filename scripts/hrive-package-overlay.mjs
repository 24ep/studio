import { createHash } from 'node:crypto';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = String(process.env.OUTBORN_REGISTRY_URL || 'https://registry.outborn.co').replace(/\/+$/, '');
const port = Number(process.env.PORT || 3000);
const packageDirectories = [
  path.join(root, 'packages', 'hrive-sdk'),
  path.join(root, 'packages', 'hrive-mcp'),
];
const packDirectory = await mkdtemp(path.join(os.tmpdir(), 'hrive-registry-'));
const packages = new Map();

for (const packageDirectory of packageDirectories) {
  const manifest = JSON.parse(await readFile(path.join(packageDirectory, 'package.json'), 'utf8'));
  const packed = await execFileAsync(
    'npm',
    ['pack', packageDirectory, '--json', '--ignore-scripts', '--pack-destination', packDirectory],
    { cwd: root, maxBuffer: 1024 * 1024 },
  );
  const packResult = JSON.parse(packed.stdout || '[]')[0];
  if (!packResult?.filename) throw new Error(`Unable to build tarball for ${manifest.name}`);

  const tarball = await readFile(path.join(packDirectory, packResult.filename));
  const shasum = createHash('sha1').update(tarball).digest('hex');
  const integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`;
  const packagePath = `/${manifest.name}`;
  const tarballName = `${manifest.name.split('/').at(-1)}-${manifest.version}.tgz`;
  const tarballPath = `${packagePath}/-/${tarballName}`;
  const builtAt = new Date().toISOString();
  const versionMetadata = {
    ...manifest,
    _id: `${manifest.name}@${manifest.version}`,
    dist: { shasum, integrity, tarball: `${registry}${tarballPath}` },
  };

  packages.set(manifest.name, {
    manifest,
    packagePath,
    tarballPath,
    tarball,
    shasum,
    metadata: {
      _id: manifest.name,
      name: manifest.name,
      description: manifest.description,
      'dist-tags': { latest: manifest.version },
      versions: { [manifest.version]: versionMetadata },
      time: { created: builtAt, modified: builtAt, [manifest.version]: builtAt },
    },
  });
}

const normalizePath = (requestUrl = '/') => {
  try {
    return decodeURIComponent(new URL(requestUrl, 'http://registry.local').pathname);
  } catch {
    return requestUrl;
  }
};

const sendJson = (res, status, payload, method = 'GET') => {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': body.length,
    'cache-control': status === 200 ? 'public, max-age=60' : 'no-store',
  });
  if (method !== 'HEAD') res.end(body);
  else res.end();
};

http.createServer((req, res) => {
  const method = String(req.method || 'GET').toUpperCase();
  const pathname = normalizePath(req.url);

  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD', 'cache-control': 'no-store' });
    res.end();
    return;
  }

  if (pathname === '/' || pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'hrive-package-publisher',
      registry,
      packages: [...packages.values()].map(({ manifest }) => ({
        name: manifest.name,
        version: manifest.version,
      })),
    }, method);
    return;
  }

  for (const entry of packages.values()) {
    if (pathname === entry.packagePath) {
      sendJson(res, 200, entry.metadata, method);
      return;
    }
    if (pathname === entry.tarballPath) {
      res.writeHead(200, {
        'content-type': 'application/octet-stream',
        'content-length': entry.tarball.length,
        'cache-control': 'public, max-age=31536000, immutable',
        etag: `"${entry.shasum}"`,
      });
      if (method !== 'HEAD') res.end(entry.tarball);
      else res.end();
      return;
    }
  }

  sendJson(res, 404, { error: 'package_not_found' }, method);
}).listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({
    event: 'hrive_registry_overlay_ready',
    registry,
    packages: [...packages.values()].map(({ manifest, tarball }) => ({
      name: manifest.name,
      version: manifest.version,
      tarballBytes: tarball.length,
    })),
  }));
});
