#!/usr/bin/env node

/**
 * Local Development Startup Script
 * 
 * This script helps set up the local environment and starts the application
 * with proper memory settings to prevent heap out of memory errors.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envLocalPath)) {

  
  const templatePath = path.join(__dirname, 'env.local.template');
  if (fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, envLocalPath);

  } else {
    console.log('❌ env.local.template not found!');
    console.log('📝 Please create .env.local manually with the following minimum configuration:');
    console.log('');
    console.log('NODE_ENV=development');
    console.log('APP_PORT=8021');
    console.log('DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE');
    console.log('NEXTAUTH_SECRET=your-local-development-secret-key-change-this');
    console.log('NEXTAUTH_URL=http://localhost:8021');
    console.log('PROCESSOR_URL=http://localhost:8021');
    console.log('');
    process.exit(1);
  }
}

// Track child processes for cleanup
const childProcesses = [];

// Function to start the main application
function startMainApp() {
  console.log('🚀 Starting main application (Docker memory management)...');
  
  const child = spawn('node', [
    './node_modules/.bin/next',
    'start',
    '-p', '8021'
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error('❌ Failed to start main application:', error.message);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    console.log(`📱 Main application exited with code ${code}`);
    // Remove from tracking array
    const index = childProcesses.indexOf(child);
    if (index > -1) {
      childProcesses.splice(index, 1);
    }
    process.exit(code);
  });
  
  childProcesses.push(child);
  return child;
}

// Function to start the processor
function startProcessor() {
  console.log('⚙️  Starting upload queue processor...');
  
  const child = spawn('node', [
    './scripts/process-upload-queue.cjs'
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error('❌ Failed to start processor:', error.message);
  });
  
  child.on('exit', (code) => {
    console.log(`⚙️  Processor exited with code ${code}`);
    // Remove from tracking array
    const index = childProcesses.indexOf(child);
    if (index > -1) {
      childProcesses.splice(index, 1);
    }
  });
  
  childProcesses.push(child);
  return child;
}

// Graceful shutdown function
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  // Kill all child processes
  childProcesses.forEach((child, index) => {
    try {
      console.log(`🛑 Terminating child process ${index + 1}...`);
      child.kill(signal);
    } catch (error) {
      console.error(`❌ Error terminating child process ${index + 1}:`, error.message);
    }
  });
  
  // Wait a bit for processes to terminate, then exit
  setTimeout(() => {
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  }, 3000);
}

// Set up signal handlers only once
let signalHandlersAdded = false;

function setupSignalHandlers() {
  if (signalHandlersAdded) return;
  signalHandlersAdded = true;
  
  // Remove any existing listeners to prevent duplicates
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  
  // Add new listeners
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  console.log('🔧 Signal handlers configured');
}

// Main execution
console.log('🎯 Local Development Startup');
console.log('============================');

// Check if we should start both or just the main app
const args = process.argv.slice(2);
const startBoth = args.includes('--with-processor') || args.includes('-p');

// Set up signal handlers
setupSignalHandlers();

if (startBoth) {
  console.log('📋 Starting both main application and processor...');
  
  const mainApp = startMainApp();
  const processor = startProcessor();
  
} else {
  console.log('📋 Starting main application only...');
  console.log('💡 Use --with-processor flag to start both app and processor');
  
  const mainApp = startMainApp();
}
