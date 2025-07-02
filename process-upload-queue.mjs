// To run as ESM: rename this file to .mjs or set "type": "module" in package.json
import fetch from 'node-fetch';

const BASE_INTERVAL_MS = parseInt(process.env.PROCESSOR_INTERVAL_MS || '5000');
const MAX_BACKOFF_MS = 60000; // 1 minute max
const PROCESS_URL = process.env.PROCESSOR_URL || 'http://app:9846/api/upload-queue/process';
const API_KEY = process.env.PROCESSOR_API_KEY;
const LOG_INTERVAL_MS = parseInt(process.env.LOG_INTERVAL_MS || '30000'); // Log every 30 seconds by default

if (!API_KEY) {
    console.error('ERROR: PROCESSOR_API_KEY environment variable is not set!');
    process.exit(1);
}

// Statistics tracking
let stats = {
    startTime: new Date(),
    totalJobsProcessed: 0,
    successfulJobs: 0,
    failedJobs: 0,
    totalErrors: 0,
    lastJobTime: null,
    consecutiveErrors: 0,
    maxConsecutiveErrors: 0,
    averageProcessingTime: 0,
    processingTimes: []
};

function logStats() {
    const now = new Date();
    const uptime = Math.floor((now - stats.startTime) / 1000);
    const mem = process.memoryUsage();
    const avgProcessingTime = stats.processingTimes.length > 0 
        ? stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length 
        : 0;
    
    console.log('='.repeat(80));
    console.log(`📊 PROCESSOR STATS - ${now.toISOString()}`);
    console.log('='.repeat(80));
    console.log(`⏱️  Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`);
    console.log(`📈 Total Jobs Processed: ${stats.totalJobsProcessed}`);
    console.log(`✅ Successful Jobs: ${stats.successfulJobs}`);
    console.log(`❌ Failed Jobs: ${stats.failedJobs}`);
    console.log(`⚠️  Total Errors: ${stats.totalErrors}`);
    console.log(`🔄 Consecutive Errors: ${stats.consecutiveErrors}`);
    console.log(`📊 Max Consecutive Errors: ${stats.maxConsecutiveErrors}`);
    console.log(`⏱️  Average Processing Time: ${avgProcessingTime.toFixed(2)}ms`);
    console.log(`💾 Memory Usage: RSS ${(mem.rss/1024/1024).toFixed(2)}MB, Heap ${(mem.heapUsed/1024/1024).toFixed(2)}MB/${(mem.heapTotal/1024/1024).toFixed(2)}MB`);
    console.log(`🔧 Configuration: Interval=${BASE_INTERVAL_MS}ms, Log Interval=${LOG_INTERVAL_MS}ms`);
    console.log(`🌐 Target URL: ${PROCESS_URL}`);
    console.log('='.repeat(80));
}

function logHealthCheck() {
    const now = new Date();
    const uptime = Math.floor((now - stats.startTime) / 1000);
    const mem = process.memoryUsage();
    
    console.log(`💓 HEALTH CHECK - ${now.toISOString()} - Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`);
    console.log(`   Memory: RSS ${(mem.rss/1024/1024).toFixed(2)}MB, Heap ${(mem.heapUsed/1024/1024).toFixed(2)}MB/${(mem.heapTotal/1024/1024).toFixed(2)}MB`);
    console.log(`   Jobs: ${stats.totalJobsProcessed} total, ${stats.successfulJobs} success, ${stats.failedJobs} failed`);
    console.log(`   Errors: ${stats.consecutiveErrors} consecutive, ${stats.maxConsecutiveErrors} max`);
}

async function getMaxConcurrentProcessors() {
    // Allow override by environment variable
    if (process.env.MAX_CONCURRENT_PROCESSORS) {
        const envValue = parseInt(process.env.MAX_CONCURRENT_PROCESSORS, 10);
        if (!isNaN(envValue) && envValue > 0) return envValue;
    }
    try {
        const res = await fetch('http://app:9846/api/settings/system-settings');
        if (!res.ok)
            throw new Error('Failed to fetch system settings');
        const settings = await res.json();
        const value = settings.maxConcurrentProcessors ? parseInt(settings.maxConcurrentProcessors, 10) : 5;
        return isNaN(value) ? 5 : value;
    } catch (e) {
        return 5;
    }
}

async function processJob() {
    const startTime = Date.now();
    try {
        const res = await fetch(PROCESS_URL, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const text = await res.text();
        const processingTime = Date.now() - startTime;
        
        if (!res.ok) {
            console.error(`❌ HTTP Error: ${res.status} - ${res.statusText} (${processingTime}ms)`);
            console.error(`   Response body:`, text);
            stats.failedJobs++;
            stats.totalErrors++;
            stats.consecutiveErrors++;
            stats.maxConsecutiveErrors = Math.max(stats.maxConsecutiveErrors, stats.consecutiveErrors);
            return false;
        }
        
        if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
            console.error(`❌ HTML Response Error (${processingTime}ms): Received HTML instead of JSON`);
            console.error(`   HTTP status: ${res.status}`);
            console.error(`   Response text: ${text.substring(0, 500)}`);
            stats.failedJobs++;
            stats.totalErrors++;
            stats.consecutiveErrors++;
            stats.maxConsecutiveErrors = Math.max(stats.maxConsecutiveErrors, stats.consecutiveErrors);
            return false;
        }
        
        try {
            const data = JSON.parse(text);
            if (data && data.message === 'No queued jobs') {
                console.log(`⏳ No jobs available (${processingTime}ms)`);
                stats.consecutiveErrors = 0; // Reset on successful check
                return false;
            } else {
                console.log(`✅ Processed job: ${JSON.stringify(data).substring(0, 200)}... (${processingTime}ms)`);
                stats.successfulJobs++;
                stats.consecutiveErrors = 0;
                return true;
            }
        } catch (err) {
            console.error(`❌ JSON Parse Error (${processingTime}ms): Could not parse response`);
            console.error(`   HTTP status: ${res.status}`);
            console.error(`   Response text: ${text}`);
            console.error(`   JSON parse error: ${err.message}`);
            stats.failedJobs++;
            stats.totalErrors++;
            stats.consecutiveErrors++;
            stats.maxConsecutiveErrors = Math.max(stats.maxConsecutiveErrors, stats.consecutiveErrors);
            return false;
        }
    } catch (err) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Network Error (${processingTime}ms): ${err.message}`);
        console.error(`   Error stack: ${err.stack}`);
        stats.failedJobs++;
        stats.totalErrors++;
        stats.consecutiveErrors++;
        stats.maxConsecutiveErrors = Math.max(stats.maxConsecutiveErrors, stats.consecutiveErrors);
        return false;
    } finally {
        const processingTime = Date.now() - startTime;
        stats.totalJobsProcessed++;
        stats.lastJobTime = new Date();
        stats.processingTimes.push(processingTime);
        
        // Keep only last 100 processing times for average calculation
        if (stats.processingTimes.length > 100) {
            stats.processingTimes = stats.processingTimes.slice(-100);
        }
    }
}

async function runProcessorLoop() {
    let backoff = BASE_INTERVAL_MS;
    let lastStatsLog = Date.now();
    let lastHealthCheck = Date.now();
    
    console.log('🚀 Starting background processor with enhanced logging...');
    console.log(`📋 Configuration: Interval=${BASE_INTERVAL_MS}ms, Log Interval=${LOG_INTERVAL_MS}ms`);
    console.log(`🌐 Target URL: ${PROCESS_URL}`);
    console.log(`🔑 API Key: ${API_KEY ? 'Configured' : 'Missing'}`);
    
    while (true) {
        const loopStartTime = Date.now();
        let hadError = false;
        
        // Log health check every 60 seconds
        if (Date.now() - lastHealthCheck > 60000) {
            logHealthCheck();
            lastHealthCheck = Date.now();
        }
        
        try {
            const maxConcurrent = await getMaxConcurrentProcessors();
            const jobs = Array.from({ length: maxConcurrent });
            const results = await Promise.all(jobs.map(() => processJob()));
            const successCount = results.filter(r => r).length;
            
            if (successCount > 0) {
                console.log(`🎯 Batch completed: ${successCount}/${maxConcurrent} jobs successful`);
            }
            
            backoff = BASE_INTERVAL_MS; // Reset backoff on success
        } catch (err) {
            hadError = true;
            console.error('❌ Background processor error:', err);
            backoff = Math.min(backoff * 2, MAX_BACKOFF_MS); // Exponential backoff
        }
        
        // Log detailed stats at regular intervals
        if (Date.now() - lastStatsLog > LOG_INTERVAL_MS) {
            logStats();
            lastStatsLog = Date.now();
        }
        
        const loopTime = Date.now() - loopStartTime;
        if (hadError) {
            console.log(`⏳ Backing off for ${backoff}ms due to error (loop took ${loopTime}ms)...`);
        } else {
            console.log(`⏳ Waiting ${backoff}ms until next cycle (loop took ${loopTime}ms)...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, backoff));
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down background processor...');
    logStats();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down background processor...');
    logStats();
    process.exit(0);
});

// Log uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    logStats();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    logStats();
    process.exit(1);
});

console.log('🚀 Starting background processor...');
runProcessorLoop().catch(err => {
    console.error('💥 Fatal error in background processor:', err);
    logStats();
    process.exit(1);
});
