import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const sourceRoot = resolve(root, "src");
const failures = [];
const warnings = [];
const trackedArchitectureDebt = [];
const lineBudgetBaseline = JSON.parse(
  await readFile(
    resolve(root, "scripts/frontend-line-budget-baseline.json"),
    "utf8",
  ),
);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(path) : [path];
    }),
  );
  return nested.flat();
}

function relativePath(file) {
  return relative(root, file).replaceAll("\\", "/");
}

function collectStringLiterals(source) {
  return Array.from(source.matchAll(/["']([^"']+)["']/g), match => match[1]);
}

const files = await collectFiles(sourceRoot);
const rootEntries = await readdir(root, { withFileTypes: true });
const rootFiles = rootEntries
  .filter((entry) => entry.isFile())
  .map((entry) => resolve(root, entry.name));
const forbiddenArtifactPattern = /^(?:temp_.*|.*\.(?:bak|old))$/i;

for (const file of [...rootFiles, ...files]) {
  if (forbiddenArtifactPattern.test(basename(file))) {
    failures.push(`${relativePath(file)}: temporary or backup artifact must not be committed`);
  }
}

const codeFiles = files.filter((file) =>
  [".ts", ".tsx"].includes(extname(file)),
);
const codeFilePaths = new Set(codeFiles.map(relativePath));

for (const baselinePath of Object.keys(lineBudgetBaseline)) {
  if (!codeFilePaths.has(baselinePath)) {
    failures.push(
      `${baselinePath}: architecture baseline entry points to a file that no longer exists`,
    );
  }
}

for (const file of codeFiles) {
  const path = relativePath(file);
  const source = await readFile(file, "utf8");

  if (
    !/\.(?:test|spec)\.[^.]+$/.test(path) &&
    !/(?:^|\/)(?:generated|__generated__)(?:\/|$)/.test(path)
  ) {
    const lineCount =
      source.split(/\r?\n/).length - (source.endsWith("\n") ? 1 : 0);
    const defaultBudget = path.startsWith("src/lib/") ? 750 : 500;
    const budget = lineBudgetBaseline[path] ?? defaultBudget;

    if (lineCount > budget) {
      failures.push(
        `${path}: ${lineCount} lines exceeds its ${budget}-line architecture budget`,
      );
    } else if (budget > defaultBudget && lineCount > defaultBudget) {
      trackedArchitectureDebt.push({ path, lineCount, defaultBudget, budget });
    }
  }

  if (
    (path.startsWith("src/components/") || path.startsWith("src/features/")) &&
    /from\s+["']@\/app\//.test(source)
  ) {
    failures.push(`${path}: shared code imports from the route layer`);
  }

  if (path.startsWith("src/components/") && /app\/.*\.css["']/.test(source)) {
    failures.push(`${path}: a shared component imports route-owned CSS`);
  }

  if (/animate-bounce/.test(source)) {
    failures.push(
      `${path}: bounce motion is not part of the interaction system`,
    );
  }

  if (/transition-\[[^\]]*(?:width|height)/.test(source)) {
    failures.push(`${path}: layout properties must not be animated`);
  }

  if (/@ts-ignore\b/.test(source)) {
    warnings.push(`${path}: replace @ts-ignore with typed narrowing or a documented @ts-expect-error`);
  }

  if (/eslint-disable(?:-next-line|-line)?\b/.test(source)) {
    warnings.push(`${path}: contains an ESLint suppression; keep suppressions narrow and documented`);
  }
}

const platformModuleFiles = codeFiles.filter((file) => {
  const path = relativePath(file);
  return path.startsWith("src/lib/platform-modules/")
    && path.endsWith("-platform-modules.ts");
});

const platformModuleIdOwners = new Map();

for (const file of platformModuleFiles) {
  const path = relativePath(file);
  const source = await readFile(file, "utf8");

  for (const match of source.matchAll(/\bid:\s*["']([^"']+)["']/g)) {
    const id = match[1];
    const owners = platformModuleIdOwners.get(id) ?? [];
    owners.push(path);
    platformModuleIdOwners.set(id, owners);
  }
}

for (const [id, owners] of platformModuleIdOwners) {
  if (owners.length > 1) {
    failures.push(
      `platform permission ${id}: duplicate module id declared in ${owners.join(", ")}`,
    );
  }
}

const sidebarConfigPath = resolve(
  sourceRoot,
  "components/layout/SidebarNavConfig.ts",
);
const sidebarConfigSource = await readFile(sidebarConfigPath, "utf8");
const referencedPermissionIds = new Set();

for (const match of sidebarConfigSource.matchAll(
  /\bpermissionId:\s*["']([^"']+)["']/g,
)) {
  referencedPermissionIds.add(match[1]);
}

for (const match of sidebarConfigSource.matchAll(
  /\bpermissionIds:\s*\[([\s\S]*?)\]/g,
)) {
  for (const permissionId of collectStringLiterals(match[1])) {
    referencedPermissionIds.add(permissionId);
  }
}

for (const permissionId of referencedPermissionIds) {
  if (!platformModuleIdOwners.has(permissionId)) {
    failures.push(
      `src/components/layout/SidebarNavConfig.ts: unknown permission id ${permissionId}`,
    );
  }
}

const globalsPath = resolve(sourceRoot, "app/globals.css");
const globals = await readFile(globalsPath, "utf8");
const globalsLines = globals.split(/\r?\n/).length;

if (globalsLines > 800) {
  failures.push(
    `src/app/globals.css: ${globalsLines} lines exceeds the 800-line architecture budget`,
  );
}
if (/debug-(?:thai|english)-font/.test(globals)) {
  failures.push("src/app/globals.css: debug-only selectors are present");
}

for (const file of files.filter((candidate) => extname(candidate) === ".css")) {
  const source = await readFile(file, "utf8");
  if (/transition:\s*(?:width|height)/.test(source)) {
    failures.push(
      `${relativePath(file)}: layout properties must not be animated`,
    );
  }
}

if (trackedArchitectureDebt.length > 0) {
  const totalExcessLines = trackedArchitectureDebt.reduce(
    (total, entry) => total + (entry.lineCount - entry.defaultBudget),
    0,
  );
  console.log(
    `Frontend architecture debt: ${trackedArchitectureDebt.length} grandfathered files, ${totalExcessLines} lines above default budgets.`,
  );
}

if (warnings.length > 0) {
  console.warn("\nFrontend quality warnings:\n");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length > 0) {
  console.error("\nFrontend architecture check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Frontend architecture check passed.");
}
