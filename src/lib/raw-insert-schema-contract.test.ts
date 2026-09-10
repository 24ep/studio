import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type ManagedInsertFields = {
  model: string;
  requiresId: boolean;
  updatedColumn: string | null;
};

function collectRuntimeSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectRuntimeSourceFiles(path);
    }
    if (!entry.name.match(/\.(ts|tsx)$/) || entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
      return [];
    }
    return [path];
  });
}

function parseManagedInsertFields(schema: string) {
  const result = new Map<string, ManagedInsertFields>();
  const modelPattern = /^model\s+(?<name>\w+)\s*\{(?<body>.*?)^\}/gms;

  for (const match of schema.matchAll(modelPattern)) {
    const name = match.groups?.name;
    const body = match.groups?.body;
    if (!name || !body) continue;

    const table = body.match(/@@map\("(?<table>[^"]+)"\)/)?.groups?.table || name;
    const idLine = body.match(/^\s*id\s+(?<definition>.*)$/m)?.groups?.definition || '';
    const updatedLine = body.match(/^\s*updatedAt\s+(?<definition>.*)$/m)?.groups?.definition || '';
    const updatedColumn = updatedLine.includes('@updatedAt')
      ? updatedLine.match(/@map\("(?<column>[^"]+)"\)/)?.groups?.column || 'updatedAt'
      : null;

    result.set(table, {
      model: name,
      requiresId: /@default\(uuid\(\)\)/.test(idLine),
      updatedColumn,
    });
  }

  return result;
}

describe('raw INSERT schema contracts', () => {
  it('supplies Prisma-managed UUID and updatedAt fields in static runtime inserts', () => {
    const workspace = process.cwd();
    const schema = readFileSync(join(workspace, 'prisma', 'schema.prisma'), 'utf8');
    const managedFieldsByTable = parseManagedInsertFields(schema);
    const violations: string[] = [];
    const insertPattern = /INSERT\s+INTO\s+"?(?<table>[A-Za-z_][A-Za-z0-9_]*)"?\s*\((?<columns>.*?)\)\s*(?:VALUES|SELECT)/gis;

    for (const file of collectRuntimeSourceFiles(join(workspace, 'src'))) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(insertPattern)) {
        const table = match.groups?.table;
        const rawColumns = match.groups?.columns;
        if (!table || !rawColumns) continue;

        const managedFields = managedFieldsByTable.get(table);
        if (!managedFields) continue;

        const columns = new Set(
          rawColumns.split(',').map((column) => column.replace(/["\s]/g, '')),
        );
        const missing: string[] = [];
        if (managedFields.requiresId && !columns.has('id')) {
          missing.push('id');
        }
        if (managedFields.updatedColumn && !columns.has(managedFields.updatedColumn)) {
          missing.push(managedFields.updatedColumn);
        }
        if (missing.length > 0) {
          violations.push(
            `${file.replace(`${workspace}\\`, '')}: ${table} (${managedFields.model}) missing ${missing.join(', ')}`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('supplies managed fields in the dynamic HR resource insert builder', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'lib', 'hr', 'hr-crud.ts'), 'utf8');

    expect(source).toContain("{ column: 'id', value: randomUUID() }");
    expect(source).toContain("{ column: 'created_at', value: now }");
    expect(source).toContain("{ column: 'updated_at', value: now }");
  });

  it('casts dynamic HR JSON parameters to jsonb on insert and update', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'lib', 'hr', 'hr-crud.ts'), 'utf8');

    expect(source).toContain("fieldType: field.type");
    expect(source).toContain("entry.fieldType === 'json' || entry.fieldType === 'jsonValue'");
    expect(source).toContain('columnValuePlaceholder(entry, index + 1)');
    expect(source).toContain('columnValuePlaceholder(entry, index + 2)');
  });
});
