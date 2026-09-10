import type {
  CompanyPortalCmsCollection,
  CompanyPortalCmsRecord,
  CompanyPortalDataFilter,
  CompanyPortalDocument,
  CompanyPortalLiveRecords,
} from './company-portal-builder';
import {
  getPlatformDataModels,
  type PlatformDataModelField,
} from './data-model-field-management';
import { isSupportedCompanyPortalField } from './company-portal-platform-fields';
import prisma from './prisma';

interface PortalModelDelegate {
  findMany: (args: {
    orderBy?: Record<string, 'asc' | 'desc'>;
    select: Record<string, boolean>;
    take: number;
    where?: Record<string, unknown>;
  }) => Promise<Array<Record<string, unknown>>>;
}

export async function loadCompanyPortalLiveRecords(
  document: CompanyPortalDocument,
  allowedModels: readonly string[],
): Promise<CompanyPortalLiveRecords> {
  const allowedModelNames = new Set(allowedModels);
  const platformModels = getPlatformDataModels();
  const entries = await Promise.all(document.collections.map(async collection => {
    if (collection.sourceType !== 'platform' || !allowedModelNames.has(collection.sourceModel)) {
      return [collection.id, []] as const;
    }

    const model = platformModels.find(item => item.name === collection.sourceModel);
    const delegate = getModelDelegate(collection.sourceModel);
    if (!model || !delegate) return [collection.id, []] as const;

    const fields = new Map(
      model.fields
        .filter(isSupportedCompanyPortalField)
        .map(field => [field.name, field]),
    );
    const selectedKeys = collection.fields
      .map(field => field.key)
      .filter(key => fields.has(key));
    if (selectedKeys.length === 0) return [collection.id, []] as const;

    const whereParts: Array<Record<string, unknown>> = [];
    for (const filter of collection.filters) {
      const field = fields.get(filter.fieldKey);
      if (!field) continue;
      const condition = buildFilterCondition(filter, field);
      if (condition === false) return [collection.id, []] as const;
      if (condition) whereParts.push(condition);
    }

    const select = Object.fromEntries(selectedKeys.map(key => [key, true]));
    if (fields.has('id')) select.id = true;
    if (fields.has('updatedAt')) select.updatedAt = true;

    try {
      const rows = await delegate.findMany({
        select,
        where: whereParts.length > 0 ? { AND: whereParts } : undefined,
        orderBy: fields.has('updatedAt')
          ? { updatedAt: 'desc' }
          : fields.has('id') ? { id: 'asc' } : undefined,
        take: 100,
      });
      return [collection.id, rows.map((row, index) => toCmsRecord(collection, row, index))] as const;
    } catch (error) {
      console.error(`[CompanyPortal] Failed to load ${collection.sourceModel} records:`, error);
      return [collection.id, []] as const;
    }
  }));

  return Object.fromEntries(entries);
}

function getModelDelegate(modelName: string): PortalModelDelegate | null {
  const delegateName = `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}`;
  const delegate = (prisma as unknown as Record<string, unknown>)[delegateName];
  if (!delegate || typeof (delegate as PortalModelDelegate).findMany !== 'function') return null;
  return delegate as PortalModelDelegate;
}

function buildFilterCondition(
  filter: CompanyPortalDataFilter,
  field: PlatformDataModelField,
): Record<string, unknown> | false | null {
  if (filter.operator === 'is_empty') {
    if (!field.isOptional) {
      return field.type === 'String' ? { [field.name]: '' } : false;
    }
    return field.type === 'String'
      ? { OR: [{ [field.name]: null }, { [field.name]: '' }] }
      : { [field.name]: null };
  }

  if (filter.operator === 'is_not_empty') {
    if (!field.isOptional) {
      return field.type === 'String' ? { [field.name]: { not: '' } } : null;
    }
    return field.type === 'String'
      ? { AND: [{ [field.name]: { not: null } }, { [field.name]: { not: '' } }] }
      : { [field.name]: { not: null } };
  }

  const value = parseFilterValue(filter.value, field.type);
  if (value === undefined) return false;

  if (filter.operator === 'equals') return { [field.name]: value };
  if (filter.operator === 'not_equals') return { [field.name]: { not: value } };
  if (filter.operator === 'contains') {
    return field.type === 'String'
      ? { [field.name]: { contains: String(value), mode: 'insensitive' } }
      : false;
  }
  if (filter.operator === 'greater_than') return { [field.name]: { gt: value } };
  if (filter.operator === 'less_than') return { [field.name]: { lt: value } };
  return null;
}

function parseFilterValue(value: string, type: string): string | number | bigint | boolean | Date | undefined {
  if (type === 'Boolean') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    return undefined;
  }
  if (['Int', 'Float', 'Decimal', 'BigInt'].includes(type)) {
    const normalized = value.trim();
    if (!normalized) return undefined;
    if (type === 'BigInt') return /^-?\d+$/.test(normalized) ? BigInt(normalized) : undefined;
    const number = Number(normalized);
    if (!Number.isFinite(number)) return undefined;
    if (type === 'Int' && !Number.isInteger(number)) return undefined;
    return number;
  }
  if (type === 'DateTime') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return value;
}

function toCmsRecord(
  collection: CompanyPortalCmsCollection,
  row: Record<string, unknown>,
  index: number,
): CompanyPortalCmsRecord {
  const updatedAt = row.updatedAt instanceof Date
    ? row.updatedAt.toISOString()
    : '1970-01-01T00:00:00.000Z';
  return {
    id: String(row.id ?? `${collection.sourceModel}-${index + 1}`),
    values: Object.fromEntries(collection.fields.map(field => [
      field.key,
      formatPortalValue(row[field.key]),
    ])),
    updatedAt,
  };
}

function formatPortalValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
