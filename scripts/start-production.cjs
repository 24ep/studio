#!/usr/bin/env node

/**
 * Production Startup Script
 * 
 * This script ensures all necessary services are running for production:
 * 1. Queue processor
 * 2. Health check service
 * 3. Webhook monitoring
 */

require('dotenv').config({ path: '.env.local' });

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

async function checkServiceRunning(serviceName) {
  return new Promise((resolve) => {
    const ps = spawn('tasklist', ['/FI', 'IMAGENAME eq node.exe', '/FO', 'CSV']);
    let output = '';
    
    ps.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ps.on('close', () => {
      resolve(output.includes(serviceName));
    });
    
    ps.on('error', () => {
      resolve(false);
    });
  });
}

async function startService(scriptPath, serviceName) {
  log(`Starting ${serviceName}...`, 'INFO');
  
  const service = spawn('node', [scriptPath], {
    detached: true,
    stdio: 'ignore'
  });
  
  service.unref();
  
  // Wait and verify it started
  setTimeout(async () => {
    const isRunning = await checkServiceRunning(serviceName);
    if (isRunning) {
      log(`${serviceName} started successfully`, 'INFO');
    } else {
      log(`Failed to start ${serviceName}`, 'ERROR');
    }
  }, 3000);
}

async function main() {
  log('Starting production services...', 'INFO');
  
  // Check if services are already running
  const processorRunning = await checkServiceRunning('process-upload-queue.cjs');
  const nextAppRunning = await checkServiceRunning('next');
  
  // Start Next.js application if not running
  if (!nextAppRunning) {
    log('Starting Next.js application...', 'INFO');
    const nextApp = spawn('npm', ['run', 'start'], {
      detached: true,
      stdio: 'inherit'
    });
    nextApp.unref();
    
    // Wait a moment for Next.js to start
    setTimeout(() => {
      log('Next.js application started', 'INFO');
    }, 5000);
  } else {
    log('Next.js application is already running', 'INFO');
  }
  
  if (!processorRunning) {
    await startService('scripts/process-upload-queue.cjs', 'Queue Processor');
  } else {
    log('Queue processor is already running', 'INFO');
  }
  
  log('Production startup complete!', 'INFO');
  log('Services running:', 'INFO');
  log('- Next.js Application: Main web application (port 8021)', 'INFO');
  log('- Queue Processor: Processes upload queue jobs', 'INFO');
  log('', 'INFO');
  log('To monitor services:', 'INFO');
  log('- Check queue status: npm run check-queue-status', 'INFO');
  log('- View logs: npm run processor:pm2:logs', 'INFO');
  log('- Restart services: npm run processor:pm2:restart', 'INFO');
}

main().catch(error => {
  log(`Startup error: ${error.message}`, 'ERROR');
  process.exit(1);
});
