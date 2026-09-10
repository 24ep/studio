const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedUploadQueue() {
  try {
    console.log('🌱 Seeding upload queue with sample data...');
    
    // Check if we already have data
    const existingCount = await prisma.uploadQueue.count();
    if (existingCount > 0) {
      console.log(`📊 Upload queue already has ${existingCount} records. Skipping seed.`);
      return;
    }
    
    // Sample data for different statuses
    const sampleJobs = [];
    
    // Create 150 jobs to test the analytics limit
    for (let i = 1; i <= 150; i++) {
      const statuses = ['queued', 'inprocess', 'success', 'failed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const fileSize = BigInt(Math.floor(Math.random() * 5000000) + 100000); // 100KB to 5MB
      const uploadDate = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7); // Random time in last week
      
      let processDate = null;
      let completedDate = null;
      let error = null;
      let errorDetails = null;
      
      if (status === 'inprocess' || status === 'success' || status === 'failed') {
        processDate = new Date(uploadDate.getTime() + Math.random() * 1000 * 60 * 30); // 0-30 minutes after upload
      }
      
      if (status === 'success' || status === 'failed') {
        completedDate = new Date(processDate.getTime() + Math.random() * 1000 * 60 * 60); // 0-60 minutes after process
      }
      
      if (status === 'failed') {
        const errorMessages = [
          'Failed to parse PDF content',
          'File format not supported',
          'Network timeout',
          'Invalid file structure',
          'Processing timeout'
        ];
        error = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        errorDetails = `Error occurred during processing: ${error}`;
      }
      
      sampleJobs.push({
        fileName: `resume_${i.toString().padStart(3, '0')}.pdf`,
        fileSize,
        status,
        source: Math.random() > 0.5 ? 'bulk' : 'manual',
        filePath: `uploads/resume_${i.toString().padStart(3, '0')}.pdf`,
        uploadDate,
        processDate,
        completedDate,
        error,
        errorDetails,
      });
    }
    
    console.log(`📝 Creating ${sampleJobs.length} sample jobs for analytics testing...`);
    
    for (const job of sampleJobs) {
      await prisma.uploadQueue.create({
        data: job
      });
    }
    
    console.log('✅ Upload queue seeded successfully!');
    
    // Verify the data
    const finalCount = await prisma.uploadQueue.count();
    console.log(`📊 Total records in upload queue: ${finalCount}`);
    
    // Show status breakdown
    const statusBreakdown = await prisma.uploadQueue.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    console.log('\n📋 Status breakdown:');
    statusBreakdown.forEach(item => {
      console.log(`  ${item.status}: ${item._count.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding upload queue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUploadQueue();
