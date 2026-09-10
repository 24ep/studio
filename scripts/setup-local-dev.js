#!/usr/bin/env node

/**
 * Local Development Setup Script
 * 
 * This script helps set up the local development environment by:
 * 1. Creating .env.local from template if it doesn't exist
 * 2. Installing dependencies if needed
 * 3. Setting up the database
 * 4. Running initial database migrations
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

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

function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            cwd: rootDir,
            shell: true,
            ...options
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        child.on('error', reject);
    });
}

async function checkFileExists(filePath) {
    try {
        await fs.promises.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function copyTemplate() {
    const envLocalPath = path.join(rootDir, '.env.local');
    const envTemplatePath = path.join(rootDir, 'env.local.template');
    
    if (await checkFileExists(envLocalPath)) {
        logInfo('.env.local already exists, skipping template copy');
        return;
    }

    if (!(await checkFileExists(envTemplatePath))) {
        logWarning('env.local.template not found, skipping environment setup');
        logInfo('You may need to manually create .env.local based on env.internal.template or env.production.template');
        return;
    }

    try {
        await fs.promises.copyFile(envTemplatePath, envLocalPath);
        logSuccess('Created .env.local from template');
        logInfo('Please review and update .env.local with your specific configuration');
    } catch (error) {
        logError(`Failed to copy template: ${error.message}`);
    }
}

async function installDependencies() {
    logInfo('Checking dependencies...');
    
    const nodeModulesPath = path.join(rootDir, 'node_modules');
    
    if (await checkFileExists(nodeModulesPath)) {
        logInfo('Dependencies already installed, skipping npm install');
        return;
    }

    try {
        logInfo('Installing dependencies...');
        await runCommand('npm', ['install']);
        logSuccess('Dependencies installed successfully');
    } catch (error) {
        logError(`Failed to install dependencies: ${error.message}`);
        throw error;
    }
}

async function setupDatabase() {
    logInfo('Setting up database...');
    
    try {
        // Check if database schema needs to be deployed
        logInfo('Running database migrations...');
        await runCommand('npm', ['run', 'db:migrate']);
        logSuccess('Database migrations completed');
    } catch (error) {
        logWarning(`Database migration failed: ${error.message}`);
        logInfo('This might be expected if the database is not running yet');
        logInfo('You can run "npm run db:migrate" manually once your database is running');
    }
}

async function checkDatabaseConnection() {
    logInfo('Checking database connection...');
    
    try {
        await runCommand('npm', ['run', 'db:check']);
        logSuccess('Database connection verified');
    } catch (error) {
        logWarning(`Database check failed: ${error.message}`);
        logInfo('Make sure your database is running and properly configured in .env.local');
    }
}

async function main() {
    log('🚀 Setting up local development environment...', 'cyan');
    console.log('');

    try {
        // Step 1: Copy environment template
        log('📋 Step 1: Setting up environment configuration...', 'blue');
        await copyTemplate();
        console.log('');

        // Step 2: Install dependencies
        log('📦 Step 2: Installing dependencies...', 'blue');
        await installDependencies();
        console.log('');

        // Step 3: Setup database
        log('🗄️  Step 3: Setting up database...', 'blue');
        await setupDatabase();
        console.log('');

        // Step 4: Check database connection
        log('🔍 Step 4: Verifying database connection...', 'blue');
        await checkDatabaseConnection();
        console.log('');

        log('🎉 Local development setup completed!', 'green');
        console.log('');
        
        log('Next steps:', 'cyan');
        log('1. Review your .env.local file and update configuration as needed', 'white');
        log('2. Make sure your database and MinIO are running', 'white');
        log('3. Run "npm run dev" to start the development server', 'white');
        log('4. Visit http://localhost:8021 to access the application', 'white');
        console.log('');
        
        log('Useful commands:', 'cyan');
        log('• npm run dev              - Start development server', 'white');
        log('• npm run dev:with-processor - Start with background processor', 'white');
        log('• npm run start:docker     - Start Docker services', 'white');
        log('• npm run db:migrate       - Run database migrations', 'white');
        log('• npm run db:check         - Check database connection', 'white');

    } catch (error) {
        console.log('');
        logError(`Setup failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the setup
main().catch((error) => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
});