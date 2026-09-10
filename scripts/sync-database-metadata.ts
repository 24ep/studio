#!/usr/bin/env tsx
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = (color: keyof typeof colors, message: string) => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message: string) => log('green', `✓ ${message}`);
const logWarning = (message: string) => log('yellow', `⚠ ${message}`);
const logError = (message: string) => log('red', `✗ ${message}`);
const logInfo = (message: string) => log('blue', `ℹ ${message}`);

interface FieldInfo {
    name: string;
    columnName: string;
    description: string;
}

interface ModelInfo {
    name: string;
    tableName: string;
    description: string;
    fields: FieldInfo[];
}

/**
 * Parse schema.prisma to extract model and field descriptions
 */
function parseSchemaFile(schemaPath: string): ModelInfo[] {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const lines = content.split('\n');
    const models: ModelInfo[] = [];

    let currentDescription = '';
    let currentModel: ModelInfo | null = null;
    let inModel = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Capture triple-slash comments
        if (line.startsWith('///')) {
            currentDescription = line.substring(3).trim();
            continue;
        }

        // Match model declaration
        const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
        if (modelMatch) {
            const modelName = modelMatch[1];
            inModel = true;

            // Find @map directive for table name, or use model name
            let tableName = modelName;

            // Look ahead for @@map directive
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine === '}') break;

                const mapMatch = nextLine.match(/@@map\("(\w+)"\)/);
                if (mapMatch) {
                    tableName = mapMatch[1];
                    break;
                }
            }

            currentModel = {
                name: modelName,
                tableName: tableName,
                description: currentDescription ? currentDescription.replace(/'/g, "''") : '',
                fields: []
            };
            models.push(currentModel);
            currentDescription = '';
            continue;
        }

        // End of model
        if (line === '}' && inModel) {
            inModel = false;
            currentModel = null;
            currentDescription = '';
            continue;
        }

        // Parse field within model
        if (inModel && currentModel && currentDescription) {
            // Match field declaration: fieldName Type @map("column_name")
            const fieldMatch = line.match(/^(\w+)\s+\w+/);
            if (fieldMatch && !line.startsWith('@@') && !line.startsWith('//')) {
                const fieldName = fieldMatch[1];

                // Check for @map directive
                const mapMatch = line.match(/@map\("(\w+)"\)/);
                const columnName = mapMatch ? mapMatch[1] : fieldName;

                currentModel.fields.push({
                    name: fieldName,
                    columnName: columnName,
                    description: currentDescription.replace(/'/g, "''")
                });
            }
            currentDescription = '';
        } else if (!line.startsWith('///')) {
            currentDescription = '';
        }
    }

    return models;
}

/**
 * Sync metadata comments to PostgreSQL
 */
async function syncMetadata(): Promise<void> {
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

    if (!fs.existsSync(schemaPath)) {
        logError(`Schema file not found: ${schemaPath}`);
        process.exit(1);
    }

    log('cyan', 'Database Metadata Synchronization');
    log('cyan', '==================================\n');

    logInfo('Parsing schema.prisma...');
    const models = parseSchemaFile(schemaPath);

    const totalFields = models.reduce((sum, m) => sum + m.fields.length, 0);
    logInfo(`Found ${models.length} models and ${totalFields} documented fields`);

    if (models.length === 0) {
        logWarning('No models with descriptions found. Nothing to sync.');
        return;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        logError('DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: databaseUrl
    });

    const client = await pool.connect();

    try {
        logInfo('Connecting to database...');

        let tableSuccessCount = 0;
        let tableSkipCount = 0;
        let columnSuccessCount = 0;
        let columnSkipCount = 0;
        let errorCount = 0;

        for (const model of models) {
            try {
                // Check if table exists
                const tableCheck = await client.query(
                    `SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    )`,
                    [model.tableName]
                );

                if (!tableCheck.rows[0].exists) {
                    logWarning(`Table "${model.tableName}" does not exist, skipping`);
                    tableSkipCount++;
                    continue;
                }

                // Apply table comment if exists
                if (model.description) {
                    const sql = `COMMENT ON TABLE "public"."${model.tableName}" IS '${model.description}'`;
                    await client.query(sql);
                    logSuccess(`Table: ${model.name}`);
                    tableSuccessCount++;
                }

                // Apply column comments
                for (const field of model.fields) {
                    try {
                        // Check if column exists
                        const columnCheck = await client.query(
                            `SELECT EXISTS (
                                SELECT FROM information_schema.columns 
                                WHERE table_schema = 'public' 
                                AND table_name = $1 
                                AND column_name = $2
                            )`,
                            [model.tableName, field.columnName]
                        );

                        if (!columnCheck.rows[0].exists) {
                            columnSkipCount++;
                            continue;
                        }

                        const sql = `COMMENT ON COLUMN "public"."${model.tableName}"."${field.columnName}" IS '${field.description}'`;
                        await client.query(sql);
                        columnSuccessCount++;
                    } catch (error: any) {
                        logError(`  Failed column ${field.name}: ${error.message}`);
                        errorCount++;
                    }
                }

            } catch (error: any) {
                logError(`Failed to update ${model.name}: ${error.message}`);
                errorCount++;
            }
        }

        console.log('');
        log('cyan', 'Summary');
        log('cyan', '-------');
        logInfo(`Total models: ${models.length}`);
        logSuccess(`Tables updated: ${tableSuccessCount}`);
        logSuccess(`Columns updated: ${columnSuccessCount}`);
        if (tableSkipCount > 0) logWarning(`Tables skipped: ${tableSkipCount}`);
        if (columnSkipCount > 0) logWarning(`Columns skipped: ${columnSkipCount}`);
        if (errorCount > 0) logError(`Errors: ${errorCount}`);

        if (errorCount === 0) {
            logSuccess('\nMetadata synchronization completed successfully!');
        } else {
            logWarning('\nMetadata synchronization completed with errors.');
        }

    } catch (error: any) {
        logError(`Database connection failed: ${error.message}`);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    syncMetadata().catch((error: any) => {
        logError(`Unexpected error: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
}

export { syncMetadata, parseSchemaFile };
