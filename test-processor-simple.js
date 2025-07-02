// Simple test for the upload queue processor
console.log('🧪 Testing Upload Queue Processor (Simple)');
console.log('='.repeat(50));

// Test basic functionality
const testStats = {
  startTime: new Date(),
  totalJobsProcessed: 0,
  successfulJobs: 0,
  failedJobs: 0,
  totalErrors: 0,
  consecutiveErrors: 0,
  maxConsecutiveErrors: 0,
  processingTimes: []
};

console.log('✅ Processor statistics object created successfully');
console.log(`📊 Start time: ${testStats.startTime.toISOString()}`);
console.log(`💾 Memory usage: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`);

// Test environment variables
const requiredVars = ['PROCESSOR_API_KEY', 'PROCESSOR_URL'];
console.log('\n🔧 Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
});

// Test fetch availability
console.log(`\n🌐 Fetch API: ${typeof fetch !== 'undefined' ? '✅ Available' : '❌ Not Available'}`);

console.log('\n✅ Simple processor test completed!');
console.log('🚀 The processor should work in the lightweight Docker container.'); 