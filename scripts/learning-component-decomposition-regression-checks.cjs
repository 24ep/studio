const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const p = (...parts) => path.join(root, ...parts);
const read = (...parts) => fs.readFileSync(p(...parts), 'utf8');
const exists = (...parts) => fs.existsSync(p(...parts));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const routeFiles = [
  ['src/app/learning/page.tsx', 'LearningHomePageClient'],
  ['src/app/learning/courses/page.tsx', 'CourseCatalogPageClient'],
  ['src/app/learning/paths/page.tsx', 'LearningPathsPageClient'],
  ['src/app/learning/certificates/page.tsx', 'EmployeeCertificatesPageClient'],
];

for (const [file, controller] of routeFiles) {
  assert(exists(file), `${file} must exist`);
  const source = read(file);
  assert(source.includes(controller), `${file} must use ${controller}`);
  assert(!source.includes('LearningPageClient'), `${file} must not reference LearningPageClient`);
}

for (const file of [
  'src/app/learning/LearningHomePageClient.tsx',
  'src/app/learning/CourseCatalogPageClient.tsx',
  'src/app/learning/CourseCatalog.tsx',
  'src/app/learning/LearningPathsPageClient.tsx',
  'src/app/learning/LearningPathsView.tsx',
  'src/app/learning/EmployeeCertificatesPageClient.tsx',
  'src/app/learning/LearningManagementPageClient.tsx',
  'src/app/learning/LearningReviewQueue.tsx',
  'src/app/learning/LearningReportsView.tsx',
]) assert(exists(file), `${file} must exist`);

assert(
  !exists('src/app/learning/LearningPageClient.tsx'),
  'LearningPageClient.tsx must be retired after dedicated route controllers are active',
);

const onboarding = read('src/app/learning/onboarding/page.tsx');
assert(onboarding.includes("redirect('/people/onboarding')"), 'Learning onboarding must redirect to People Onboarding');
assert(!onboarding.includes('LearningPageClient'), 'Learning onboarding must not own a Learning controller');

const model = read('src/app/learning/learning-workspace-model.ts');
assert(!model.includes('OnboardingForm'), 'Learning workspace model must not keep duplicate onboarding form state');
assert(!model.includes('onboardingFormDefault'), 'Learning workspace model must not keep duplicate onboarding defaults');

console.log('Learning component decomposition regression checks passed.');
