const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const checker = path.join(root, "scripts/check-frontend-architecture.mjs");

function runArchitectureCheck() {
  return spawnSync(process.execPath, [checker], {
    cwd: root,
    encoding: "utf8",
  });
}

function output(result) {
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

const baseline = runArchitectureCheck();
assert.equal(
  baseline.status,
  0,
  `architecture baseline must pass before artifact probes:\n${output(baseline)}`,
);

const probes = [
  ["temp_architecture_probe.txt", "temporary root artifact"],
  ["src/architecture-probe.bak", "backup source artifact"],
  ["src/architecture-probe.old", "old source artifact"],
];

for (const [relativePath, label] of probes) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, "architecture regression probe\n", "utf8");

  let result;
  try {
    result = runArchitectureCheck();
  } finally {
    fs.rmSync(absolutePath, { force: true });
  }

  assert.notEqual(result.status, 0, `${label} must fail the architecture check`);
  assert.match(
    output(result),
    new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `${label} failure must identify ${relativePath}`,
  );
}

console.log("Frontend architecture regression checks passed.");
