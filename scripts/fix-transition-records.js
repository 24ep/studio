const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTransitionRecords() {
  console.log('Starting transition record fix...');

  try {
    // 1. Get all stage names and IDs map
    const stages = await prisma.recruitmentStage.findMany();
    const stageMap = {};
    stages.forEach(s => {
      stageMap[s.name.toLowerCase()] = s.id;
    });
    console.log(`Loaded ${stages.length} recruitment stages.`);

    // 2. Find records with potential non-UUID stages
    // Since we can't easily filter non-UUID via Prisma `findMany` where clause directly without raw query on generic string field,
    // we will fetch all and filter in JS, OR use raw query if dataset is huge. 
    // Assuming manageable dataset size for this fix script, but let's be safe and use raw query to find IDs.
    
    const badRecords = await prisma.$queryRaw`
      SELECT id, stage FROM "TransitionRecord" 
      WHERE stage !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `;

    console.log(`Found ${badRecords.length} records with non-UUID stage values.`);

    let fixedCount = 0;
    let failedCount = 0;

    for (const record of badRecords) {
      const currentStage = record.stage;
      const lowerStage = currentStage.toLowerCase();

      let newStageId = stageMap[lowerStage];

      // Special handling for common mismatches if necessary
      if (!newStageId && lowerStage === 'applied') {
        // If 'Applied' stage exists in map?
        if (stageMap['applied']) newStageId = stageMap['applied'];
      }

      if (newStageId) {
        await prisma.transitionRecord.update({
          where: { id: record.id },
          data: { stage: newStageId }
        });
        // console.log(`Fixed record ${record.id}: '${currentStage}' -> '${newStageId}'`);
        fixedCount++;
      } else {
        console.warn(`Could not resolve stage ID for value: '${currentStage}' (Record ID: ${record.id})`);
        failedCount++;
      }
    }

    console.log('-----------------------------------');
    console.log(`Fix completed.`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Unresolved/Failed: ${failedCount}`);

  } catch (error) {
    console.error('Error fixing transition records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTransitionRecords()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
