import prisma from '@/lib/prisma';
import type { DataModel } from '@/lib/types';

export interface DataModelField {
  name: string;
  type: string;
  required: boolean;
  label?: string;
  description?: string;
  format?: string;
  enum?: string[];
  items?: { type: string };
}

export interface DataModelSchema {
  type: string;
  properties: Record<string, DataModelField>;
  required: string[];
}

/**
 * Convert Prisma DataModel to our DataModel type
 */
function convertPrismaDataModel(prismaModel: any): DataModel {
  return {
    id: prismaModel.id,
    name: prismaModel.name,
    modelType: prismaModel.modelType,
    description: prismaModel.description || undefined,
    schema: prismaModel.schema,
    isActive: prismaModel.isActive,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt
  };
}

/**
 * Get data model by type (Candidate, Position, User, etc.)
 */
export async function getDataModelByType(modelType: string): Promise<DataModel | null> {
  try {
    const dataModel = await prisma.dataModel.findFirst({
      where: {
        modelType,
        isActive: true
      }
    });
    return dataModel ? convertPrismaDataModel(dataModel) : null;
  } catch (error) {
    console.error('Error fetching data model by type:', error);
    return null;
  }
}

/**
 * Get all active data models
 */
export async function getActiveDataModels(): Promise<DataModel[]> {
  try {
    const dataModels = await prisma.dataModel.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    return dataModels.map(convertPrismaDataModel);
  } catch (error) {
    console.error('Error fetching active data models:', error);
    return [];
  }
}

/**
 * Extract fields from a data model schema
 */
export function extractFieldsFromSchema(schema: any): DataModelField[] {
  if (!schema || !schema.properties) {
    return [];
  }

  const fields: DataModelField[] = [];
  const required = schema.required || [];

  Object.entries(schema.properties).forEach(([fieldName, fieldConfig]: [string, any]) => {
    fields.push({
      name: fieldName,
      type: fieldConfig.type || 'string',
      required: required.includes(fieldName),
      label: fieldConfig.label || fieldName,
      description: fieldConfig.description,
      format: fieldConfig.format,
      enum: fieldConfig.enum,
      items: fieldConfig.items
    });
  });

  return fields;
}

/**
 * Validate data against a data model schema
 */
export function validateDataAgainstSchema(data: any, schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = schema.required || [];

  // Check required fields
  required.forEach((fieldName: string) => {
    if (!data.hasOwnProperty(fieldName) || data[fieldName] === null || data[fieldName] === undefined) {
      errors.push(`Field '${fieldName}' is required`);
    }
  });

  // Check field types
  Object.entries(schema.properties || {}).forEach(([fieldName, fieldConfig]: [string, any]) => {
    if (data.hasOwnProperty(fieldName) && data[fieldName] !== null && data[fieldName] !== undefined) {
      const value = data[fieldName];
      const expectedType = fieldConfig.type;

      switch (expectedType) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Field '${fieldName}' must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Field '${fieldName}' must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Field '${fieldName}' must be a boolean`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Field '${fieldName}' must be an array`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push(`Field '${fieldName}' must be an object`);
          }
          break;
        case 'date':
          if (isNaN(Date.parse(value))) {
            errors.push(`Field '${fieldName}' must be a valid date`);
          }
          break;
      }

      // Check email format
      if (fieldConfig.format === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`Field '${fieldName}' must be a valid email address`);
        }
      }

      // Check enum values
      if (fieldConfig.enum && Array.isArray(fieldConfig.enum)) {
        if (!fieldConfig.enum.includes(value)) {
          errors.push(`Field '${fieldName}' must be one of: ${fieldConfig.enum.join(', ')}`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get candidate data model fields
 */
export async function getCandidateFields(): Promise<DataModelField[]> {
  const candidateModel = await getDataModelByType('Candidate');
  if (!candidateModel || !candidateModel.schema) {
    return [];
  }
  return extractFieldsFromSchema(candidateModel.schema);
}

/**
 * Get position data model fields
 */
export async function getPositionFields(): Promise<DataModelField[]> {
  const positionModel = await getDataModelByType('Position');
  if (!positionModel || !positionModel.schema) {
    return [];
  }
  return extractFieldsFromSchema(positionModel.schema);
}

/**
 * Get user data model fields
 */
export async function getUserFields(): Promise<DataModelField[]> {
  const userModel = await getDataModelByType('User');
  if (!userModel || !userModel.schema) {
    return [];
  }
  return extractFieldsFromSchema(userModel.schema);
}

/**
 * Create a new data model
 */
export async function createDataModel(data: Omit<DataModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataModel> {
  const newModel = await prisma.dataModel.create({
    data: {
      name: data.name,
      modelType: data.modelType,
      description: data.description,
      schema: data.schema,
      isActive: data.isActive
    }
  });
  return convertPrismaDataModel(newModel);
}

/**
 * Update an existing data model
 */
export async function updateDataModel(id: string, data: Partial<DataModel>): Promise<DataModel> {
  const updatedModel = await prisma.dataModel.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
  return convertPrismaDataModel(updatedModel);
}

/**
 * Delete a data model
 */
export async function deleteDataModel(id: string): Promise<void> {
  await prisma.dataModel.delete({
    where: { id }
  });
} 