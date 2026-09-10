import fs from 'fs';
import path from 'path';

import type { CustomFieldDefinition } from './types';

export interface PlatformDataModelField {
  defaultValue?: string;
  isEditable: boolean;
  isList: boolean;
  isOptional: boolean;
  isSystem: boolean;
  label: string;
  name: string;
  nativeType?: string;
  type: string;
}

export interface PlatformDataModel {
  customFields: CustomFieldDefinition[];
  fields: PlatformDataModelField[];
  label: string;
  name: string;
}

interface ParsedPrismaField {
  attributes: string;
  name: string;
  typeToken: string;
}

const SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema.prisma');

export function getPlatformDataModelNames() {
  return getPlatformDataModels().map(model => model.name);
}

export function isPlatformDataModelName(modelName: string) {
  return getPlatformDataModelNames().includes(modelName);
}

export function getPlatformDataModels(customFields: CustomFieldDefinition[] = []): PlatformDataModel[] {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  return parsePrismaModels(schema).map(model => ({
    name: model.name,
    label: toTitleLabel(model.name),
    fields: model.fields.map(field => mapPrismaField(field)),
    customFields: customFields
      .filter(field => field.model_name === model.name)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.label.localeCompare(b.label)),
  }));
}

function parsePrismaModels(schema: string) {
  const modelRegex = /model\s+(\w+)\s+\{([\s\S]*?)\n\}/g;
  const models: Array<{ fields: ParsedPrismaField[]; name: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(schema)) !== null) {
    const [, name, body] = match;
    models.push({
      name,
      fields: parsePrismaModelFields(body),
    });
  }

  return models;
}

function parsePrismaModelFields(body: string): ParsedPrismaField[] {
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//') && !line.startsWith('///') && !line.startsWith('@@'))
    .map(line => {
      const [name, typeToken, ...attributeParts] = line.split(/\s+/);
      return {
        name,
        typeToken,
        attributes: attributeParts.join(' '),
      };
    })
    .filter(field => Boolean(field.name && field.typeToken));
}

function mapPrismaField(field: ParsedPrismaField): PlatformDataModelField {
  const baseType = field.typeToken.replace(/[?\[\]]/g, '');
  return {
    defaultValue: extractDefaultValue(field.attributes),
    isEditable: false,
    isList: field.typeToken.endsWith('[]'),
    isOptional: field.typeToken.includes('?'),
    isSystem: true,
    label: toTitleLabel(field.name),
    name: field.name,
    nativeType: extractNativeType(field.attributes),
    type: baseType,
  };
}

function extractDefaultValue(attributes: string) {
  const defaultMatch = attributes.match(/@default\(([^)]*(?:\)[^)]*)?)\)/);
  return defaultMatch?.[1];
}

function extractNativeType(attributes: string) {
  const nativeTypeMatch = attributes.match(/@db\.(\w+)/);
  return nativeTypeMatch?.[1];
}

export function toTitleLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}
