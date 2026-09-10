import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import type { DbClient } from "@/lib/db";

export const DATA_MODEL_BACKUP_FORMAT = "hrive-business-transfer/v1";
export const DATA_TRANSFER_DOMAINS = [
  "people",
  "recruiting",
  "attendance",
  "leave",
  "performance",
  "learning",
  "payroll",
  "surveys",
  "expenses",
  "configuration",
] as const;
export type DataTransferDomain = (typeof DATA_TRANSFER_DOMAINS)[number];
type BackupTable = {
  model: string;
  table: string;
  rows: Record<string, unknown>[];
};
export interface DataModelBackup {
  format: typeof DATA_MODEL_BACKUP_FORMAT;
  exportedAt: string;
  schemaVersion: string;
  domains: DataTransferDomain[];
  models: BackupTable[];
}
const quoteIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`;
const MAX_TRANSFER_PAYLOAD_BYTES = 250 * 1024 * 1024;

const NEVER_TRANSFER_MODELS =
  /(?:User|Account|Session|ApiKey|Token|Password|Audit|LogEntry|Webhook|DataOperationJob|UploadQueue|Notification|ReadStatus|Reminder|DeadLetter|Outbox|Sensitive.*Access|Privacy|SystemSetting|SystemPreference|SystemPrompt|ScreeningFinding)/i;

type TransferManifest = {
  kind: "manifest";
  format: typeof DATA_MODEL_BACKUP_FORMAT;
  exportedAt: string;
  schemaVersion: string;
  domains: DataTransferDomain[];
  modelCount: number;
  rowCount: number;
  checksum: {
    algorithm: "sha256";
    value: string;
  };
};

type TransferModelChunk = {
  kind: "model";
  model: string;
  table: string;
  rows: Record<string, unknown>[];
};

type TransferChunk = TransferManifest | TransferModelChunk;

export function getDataTransferDomain(model: string): DataTransferDomain {
  if (
    /Applicant|Recruitment|Position|JobOffer|JobMatch|Expertise|Personality|SkillTemplate|Headcount/i.test(
      model,
    )
  )
    return "recruiting";
  if (
    /Attendance|Shift|Roster|Timesheet|Overtime|WorkSchedule|OpenShift|Availability/i.test(
      model,
    )
  )
    return "attendance";
  if (/Leave|Holiday/i.test(model)) return "leave";
  if (
    /Performance|Appraisal|Goal|Feedback|Recognition|Competency|Development/i.test(
      model,
    )
  )
    return "performance";
  if (/Learning|Course|Lesson|Quiz|Certification/i.test(model))
    return "learning";
  if (/Payroll|Payslip|Compensation|Benefit/i.test(model)) return "payroll";
  if (/Survey/i.test(model)) return "surveys";
  if (/expense|advance|travel/i.test(model)) return "expenses";
  if (
    /Employee|Department|Company|Grade|Client|CostCenter|Project|Asset|Transportation|hr_case|employment|onboarding|support|document|mobility|opportunit|exit|succession|successor|talent|workforce/i.test(
      model,
    )
  )
    return "people";
  return "configuration";
}

export function getDataModelTables() {
  return Prisma.dmmf.datamodel.models
    .filter((model) => !NEVER_TRANSFER_MODELS.test(model.name))
    .map((model) => ({
      model: model.name,
      table: model.dbName || model.name,
      domain: getDataTransferDomain(model.name),
    }));
}

function jsonReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value)) return { $binary: value.toString("base64") };
  return value;
}

function restorePortableValue(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === "Buffer" &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return Buffer.from((value as { data: number[] }).data);
  }
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    "$binary" in value
  ) {
    const encoded = (value as { $binary?: unknown }).$binary;
    if (typeof encoded === "string") return Buffer.from(encoded, "base64");
  }
  return value;
}

function toTransferChunks(backup: DataModelBackup) {
  const data = Buffer.from(JSON.stringify(backup, jsonReplacer, 2), "utf8");
  const checksum = createHash("sha256").update(data).digest("hex");
  const manifest: TransferManifest = {
    kind: "manifest",
    format: backup.format,
    exportedAt: backup.exportedAt,
    schemaVersion: backup.schemaVersion,
    domains: backup.domains,
    modelCount: backup.models.length,
    rowCount: backup.models.reduce((sum, model) => sum + model.rows.length, 0),
    checksum: { algorithm: "sha256", value: checksum },
  };
  const chunks: TransferChunk[] = [
    manifest,
    ...backup.models.map((entry): TransferModelChunk => ({
      kind: "model",
      model: entry.model,
      table: entry.table,
      rows: entry.rows,
    })),
  ];
  return chunks;
}

export async function exportAllDataModels(
  client: DbClient,
  requestedDomains: DataTransferDomain[] = [...DATA_TRANSFER_DOMAINS],
) {
  const selectedDomains = requestedDomains.filter(
    (domain, index) =>
      DATA_TRANSFER_DOMAINS.includes(domain) &&
      requestedDomains.indexOf(domain) === index,
  );
  if (!selectedDomains.length)
    throw new Error("Select at least one business data domain.");
  const models: BackupTable[] = [];
  for (const descriptor of getDataModelTables()) {
    if (!selectedDomains.includes(descriptor.domain)) continue;
    const result = await client.query(
      `SELECT * FROM ${quoteIdentifier(descriptor.table)}`,
    );
    models.push({
      model: descriptor.model,
      table: descriptor.table,
      rows: result.rows,
    });
  }
  const backup: DataModelBackup = {
    format: DATA_MODEL_BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    schemaVersion: process.env.npm_package_version || "unknown",
    domains: selectedDomains,
    models,
  };
  return Buffer.from(JSON.stringify(backup, jsonReplacer, 2), "utf8");
}

export async function createBusinessTransferPackage(
  client: DbClient,
  domains: DataTransferDomain[],
) {
  const data = await exportAllDataModels(client, domains);
  const backup = parseDataModelBackup(data);
  const chunks = toTransferChunks(backup);
  const payload = chunks.map((chunk) => JSON.stringify(chunk)).join("\n");
  return Buffer.from(payload, "utf8");
}

export async function parseBusinessTransferPackage(data: Buffer) {
  if (data.length > MAX_TRANSFER_PAYLOAD_BYTES) {
    throw new Error("Transfer package expands beyond the 250 MB safety limit.");
  }

  const lines = data
    .toString("utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    throw new Error("The uploaded file is not a valid transfer package.");
  }

  let manifest: TransferManifest | null = null;
  const models: BackupTable[] = [];
  const allowedTables = new Set(getDataModelTables().map((item) => item.table));
  const seenModelTables = new Set<string>();

  for (const line of lines) {
    let chunk: unknown;
    try {
      chunk = JSON.parse(line);
    } catch {
      throw new Error("The uploaded file is not a valid transfer package.");
    }
    if (!chunk || typeof chunk !== "object" || Array.isArray(chunk)) {
      throw new Error("The uploaded file is not a valid transfer package.");
    }

    const kind = (chunk as { kind?: unknown }).kind;
    if (kind === "manifest") {
      if (manifest)
        throw new Error(
          "Transfer package contains more than one manifest chunk.",
        );
      const candidate = chunk as TransferManifest;
      if (candidate.format !== DATA_MODEL_BACKUP_FORMAT) {
        throw new Error(
          `The uploaded file is not a ${DATA_MODEL_BACKUP_FORMAT} file.`,
        );
      }
      if (
        !Array.isArray(candidate.domains) ||
        !candidate.domains.every(
          (item): item is DataTransferDomain =>
            typeof item === "string" && DATA_TRANSFER_DOMAINS.includes(item),
        )
      ) {
        throw new Error(
          "Transfer package contains an unsupported business domain.",
        );
      }
      if (
        !candidate.checksum ||
        candidate.checksum.algorithm !== "sha256" ||
        typeof candidate.checksum.value !== "string"
      ) {
        throw new Error("Transfer package checksum is missing.");
      }
      if (
        typeof candidate.modelCount !== "number" ||
        candidate.modelCount < 0 ||
        typeof candidate.rowCount !== "number" ||
        candidate.rowCount < 0
      ) {
        throw new Error("Transfer package manifest is invalid.");
      }
      manifest = candidate;
      continue;
    }

    if (kind === "model") {
      const candidate = chunk as TransferModelChunk;
      if (
        typeof candidate.model !== "string" ||
        typeof candidate.table !== "string" ||
        !Array.isArray(candidate.rows)
      ) {
        throw new Error("Transfer package contains a malformed data model.");
      }
      if (!allowedTables.has(candidate.table)) {
        throw new Error(
          "Transfer package contains an unknown or malformed data model.",
        );
      }
      if (seenModelTables.has(candidate.table)) {
        throw new Error("Transfer package contains a duplicate data model.");
      }
      seenModelTables.add(candidate.table);
      models.push({
        model: candidate.model,
        table: candidate.table,
        rows: candidate.rows,
      });
      continue;
    }

    throw new Error("Transfer package contains an unknown chunk type.");
  }

  if (!manifest)
    throw new Error("Transfer package must contain a manifest chunk.");

  const backup: DataModelBackup = {
    format: manifest.format,
    exportedAt: manifest.exportedAt,
    schemaVersion: manifest.schemaVersion,
    domains: manifest.domains,
    models,
  };
  const parsed = parseDataModelBackup(
    Buffer.from(JSON.stringify(backup, jsonReplacer, 2), "utf8"),
  );
  const dataBuffer = Buffer.from(
    JSON.stringify(parsed, jsonReplacer, 2),
    "utf8",
  );
  if (
    createHash("sha256").update(dataBuffer).digest("hex") !==
    manifest.checksum.value
  ) {
    throw new Error("Transfer package integrity check failed.");
  }
  if (parsed.models.length !== manifest.modelCount) {
    throw new Error(
      `Transfer package contains ${parsed.models.length} model chunks but manifest declares ${manifest.modelCount}.`,
    );
  }
  if (
    parsed.models.reduce((sum, model) => sum + model.rows.length, 0) !==
    manifest.rowCount
  ) {
    throw new Error(
      "Transfer package row count does not match the manifest declaration.",
    );
  }
  const allowed = new Set(getDataModelTables().map((item) => item.table));
  if (parsed.domains.some((domain) => !DATA_TRANSFER_DOMAINS.includes(domain)))
    throw new Error(
      "Transfer package contains an unsupported business domain.",
    );
  if (
    parsed.models.some(
      (model) =>
        !model || !allowed.has(model.table) || !Array.isArray(model.rows),
    )
  )
    throw new Error("Backup contains an unknown or malformed data model.");
  return parsed;
}

export function parseDataModelBackup(data: Buffer): DataModelBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data.toString("utf8"));
  } catch {
    throw new Error("The uploaded file is not valid JSON.");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as { format?: unknown }).format !== DATA_MODEL_BACKUP_FORMAT ||
    !Array.isArray((parsed as { models?: unknown }).models) ||
    !Array.isArray((parsed as { domains?: unknown }).domains)
  ) {
    throw new Error(
      `The uploaded file is not a ${DATA_MODEL_BACKUP_FORMAT} file.`,
    );
  }
  return parsed as DataModelBackup;
}

export async function importAllDataModels(
  client: DbClient,
  backup: DataModelBackup,
) {
  const allowed = new Set(getDataModelTables().map((item) => item.table));
  const dependencyResult = await client.query(
    `SELECT child.relname AS child, parent.relname AS parent FROM pg_constraint constraint_record JOIN pg_class child ON child.oid = constraint_record.conrelid JOIN pg_class parent ON parent.oid = constraint_record.confrelid WHERE constraint_record.contype = 'f' AND child.relname = ANY($1::text[]) AND parent.relname = ANY($1::text[])`,
    [backup.models.map((model) => model.table)],
  );
  const pending = [...backup.models];
  const ordered: BackupTable[] = [];
  const completed = new Set<string>();
  while (pending.length) {
    const index = pending.findIndex((entry) =>
      dependencyResult.rows.every(
        (relation) =>
          String(relation.child) !== entry.table ||
          String(relation.parent) === entry.table ||
          completed.has(String(relation.parent)),
      ),
    );
    const [next] = pending.splice(index >= 0 ? index : 0, 1);
    ordered.push(next);
    completed.add(next.table);
  }
  let importedRows = 0;
  let importedModels = 0;
  await client.query("BEGIN");
  try {
    for (const entry of ordered) {
      if (
        !entry ||
        typeof entry.table !== "string" ||
        !allowed.has(entry.table) ||
        !Array.isArray(entry.rows)
      )
        throw new Error("Backup contains an unknown or malformed data model.");
      if (entry.table === "data_operation_jobs" || entry.rows.length === 0)
        continue;
      const columnResult = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
        [entry.table],
      );
      const allowedColumns = new Set(
        columnResult.rows.map((row) => String(row.column_name)),
      );
      const primaryResult = await client.query(
        `SELECT a.attname AS column_name FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = $1::regclass AND i.indisprimary`,
        [`public.${quoteIdentifier(entry.table)}`],
      );
      const primaryColumns = primaryResult.rows.map((row) =>
        String(row.column_name),
      );
      for (const row of entry.rows) {
        if (!row || typeof row !== "object" || Array.isArray(row))
          throw new Error(`Model ${entry.model} contains a malformed row.`);
        const columns = Object.keys(row).filter((column) =>
          allowedColumns.has(column),
        );
        if (!columns.length) continue;
        const values = columns.map((column) =>
          restorePortableValue(row[column]),
        );
        const conflict =
          primaryColumns.length > 0 &&
          primaryColumns.every((column) => columns.includes(column));
        const updates = columns.filter(
          (column) => !primaryColumns.includes(column),
        );
        const onConflict = conflict
          ? ` ON CONFLICT (${primaryColumns.map(quoteIdentifier).join(", ")}) ${updates.length ? `DO UPDATE SET ${updates.map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`).join(", ")}` : "DO NOTHING"}`
          : "";
        await client.query(
          `INSERT INTO ${quoteIdentifier(entry.table)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${columns.map((_, index) => `$${index + 1}`).join(", ")})${onConflict}`,
          values,
        );
        importedRows += 1;
      }
      importedModels += 1;
    }
    await client.query("COMMIT");
    return { importedModels, importedRows };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
