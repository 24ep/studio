#!/usr/bin/env node

/**
 * Permission Reset and Verification Script
 * 
 * This script:
 * 1. Resets all user group permissions to the granular format defined in PLATFORM_MODULES
 * 2. Verifies permission integrity across the system
 * 3. Ensures all permissions in the database are valid according to the current schema
 */

require('dotenv').config({ path: '.env.local' });

// Use tsx to run TypeScript files directly
const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

/**
 * Run TypeScript file with tsx
 */
function runTypeScriptFile(filePath, args = []) {
    return new Promise((resolve, reject) => {
        const tsxPath = path.join(__dirname, '../node_modules/.bin/tsx');
        const scriptPath = path.join(__dirname, filePath);
        
        const child = spawn(tsxPath, [scriptPath, ...args], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Main execution function
 */
async function main() {
    const command = process.argv[2];
    
    if (command === 'reset') {
        log('🔄 Resetting permissions to granular format...', 'cyan');
        try {
            await runTypeScriptFile('../src/scripts/reset-permissions.ts', ['reset']);
            logSuccess('Permission reset completed successfully');
            process.exit(0);
        } catch (error) {
            logError(`Permission reset failed: ${error.message}`);
            process.exit(1);
        }
    } else if (command === 'verify') {
        log('🔍 Verifying permission integrity...', 'cyan');
        try {
            await runTypeScriptFile('../src/scripts/reset-permissions.ts', ['verify']);
            logSuccess('Permission verification completed successfully');
            process.exit(0);
        } catch (error) {
            logError(`Permission verification failed: ${error.message}`);
            process.exit(1);
        }
    } else {
        log('Usage:', 'cyan');
        log('  node scripts/reset-permissions.js reset   - Reset permissions to granular format', 'white');
        log('  node scripts/reset-permissions.js verify  - Verify permission integrity', 'white');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch((error) => {
        logError(`Unexpected error: ${error.message}`);
        console.error(error);
        process.exit(1);
    });
}
