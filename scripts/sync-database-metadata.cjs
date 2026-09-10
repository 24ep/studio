#!/usr/bin/env node

/**
 * Database Metadata Synchronization Script Wrapper
 * 
 * This script uses tsx to run the TypeScript version of the metadata sync
 */

const { spawn } = require('child_process');
const path = require('path');

async function runTypeScriptFile(scriptPath) {
    return new Promise((resolve, reject) => {
        const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', 'tsx');
        const fullScriptPath = path.join(__dirname, scriptPath);

        console.log(`Running: ${scriptPath}`);

        const child = spawn(tsxPath, [fullScriptPath], {
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script failed with code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function main() {
    try {
        await runTypeScriptFile('sync-database-metadata.ts');
    } catch (error) {
        console.error('ERROR: Metadata sync failed!');
        console.error(error.message);
        process.exit(1);
    }
}

main();
