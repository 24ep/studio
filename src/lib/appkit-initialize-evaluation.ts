import { fetchAppKitSeedCollection, type AppKitEnvironment } from '@/lib/appkit-sdk-client';
import prisma from '@/lib/prisma';

type EvaluationSeed = {
  recordType?: string;
  key?: string;
  name?: string;
  description?: string;
  color?: string;
  parentKey?: string;
  maxScore?: number;
  skillType?: string;
  shortDescription?: string;
  isActive?: boolean;
  sortOrder?: number;
  expertiseGroupKeys?: string[];
  expertiseSkillKeys?: string[];
  personalityGroupKeys?: string[];
  personalityTraitKeys?: string[];
};

const EVALUATION_BOOTSTRAP_LOCK = 2_024_080_101;

export async function initializeEvaluationConfigurationFromAppKit(environment: AppKitEnvironment = 'production') {
  const existing = await countEvaluationConfiguration();
  if (existing > 0) return;

  const records = await fetchAppKitSeedCollection<EvaluationSeed>(environment, 'evaluation_configuration');
  const seeds = records.filter((record): record is EvaluationSeed & { recordType: string; key: string; name: string } =>
    Boolean(record.recordType?.trim() && record.key?.trim() && record.name?.trim()),
  );
  if (!seeds.length) return;

  await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${EVALUATION_BOOTSTRAP_LOCK})`);
    const total = await Promise.all([
      tx.expertiseGroup.count(),
      tx.expertiseSkill.count(),
      tx.personalityGroup.count(),
      tx.personalityTrait.count(),
      tx.skillTemplate.count(),
    ]);
    if (total.some(count => count > 0)) return;

    const expertiseGroups = new Map<string, string>();
    const expertiseSkills = new Map<string, string>();
    const personalityGroups = new Map<string, string>();
    const personalityTraits = new Map<string, string>();

    for (const seed of seeds.filter(item => item.recordType === 'expertise_group')) {
      const group = await tx.expertiseGroup.create({ data: groupData(seed, '#3B82F6') });
      expertiseGroups.set(seed.key, group.id);
    }
    for (const seed of seeds.filter(item => item.recordType === 'personality_group')) {
      const group = await tx.personalityGroup.create({ data: groupData(seed, '#10B981') });
      personalityGroups.set(seed.key, group.id);
    }
    for (const seed of seeds.filter(item => item.recordType === 'expertise_skill')) {
      const skill = await tx.expertiseSkill.create({
        data: {
          name: seed.name.trim(),
          description: clean(seed.description),
          maxScore: integer(seed.maxScore, 100),
          skillType: clean(seed.skillType) || 'hard_skill',
          isActive: seed.isActive !== false,
          sortOrder: integer(seed.sortOrder, 0),
          groupId: seed.parentKey ? expertiseGroups.get(seed.parentKey) : undefined,
        },
      });
      expertiseSkills.set(seed.key, skill.id);
    }
    for (const seed of seeds.filter(item => item.recordType === 'personality_trait')) {
      const trait = await tx.personalityTrait.create({
        data: {
          name: seed.name.trim(),
          description: clean(seed.description),
          shortDescription: clean(seed.shortDescription),
          isActive: seed.isActive !== false,
          sortOrder: integer(seed.sortOrder, 0),
          groupId: seed.parentKey ? personalityGroups.get(seed.parentKey) : undefined,
        },
      });
      personalityTraits.set(seed.key, trait.id);
    }
    for (const seed of seeds.filter(item => item.recordType === 'skill_template')) {
      await tx.skillTemplate.create({
        data: {
          name: seed.name.trim(),
          description: clean(seed.description),
          isActive: seed.isActive !== false,
          templateGroups: { create: resolveIds(seed.expertiseGroupKeys, expertiseGroups).map(id => ({ group: { connect: { id } } })) },
          templateSkills: { create: resolveIds(seed.expertiseSkillKeys, expertiseSkills).map(id => ({ skill: { connect: { id } } })) },
          templatePersonalityGroups: { create: resolveIds(seed.personalityGroupKeys, personalityGroups).map(id => ({ group: { connect: { id } } })) },
          templatePersonalityTraits: { create: resolveIds(seed.personalityTraitKeys, personalityTraits).map(id => ({ trait: { connect: { id } } })) },
        },
      });
    }
  });
}

async function countEvaluationConfiguration() {
  const counts = await Promise.all([
    prisma.expertiseGroup.count(),
    prisma.expertiseSkill.count(),
    prisma.personalityGroup.count(),
    prisma.personalityTrait.count(),
    prisma.skillTemplate.count(),
  ]);
  return counts.reduce((sum, count) => sum + count, 0);
}

function groupData(seed: EvaluationSeed & { name: string }, defaultColor: string) {
  return {
    name: seed.name.trim(),
    description: clean(seed.description),
    color: clean(seed.color) || defaultColor,
    isActive: seed.isActive !== false,
    sortOrder: integer(seed.sortOrder, 0),
  };
}

function clean(value: string | undefined) {
  return value?.trim() || null;
}

function integer(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? Math.trunc(value as number) : fallback;
}

function resolveIds(keys: string[] | undefined, ids: Map<string, string>) {
  return (keys || [])
    .map(key => ids.get(key))
    .filter((id): id is string => Boolean(id));
}
