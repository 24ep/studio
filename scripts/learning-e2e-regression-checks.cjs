const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const file = (...parts) => path.join(root, ...parts);
const read = (...parts) => fs.readFileSync(file(...parts), 'utf8');
const exists = (...parts) => fs.existsSync(file(...parts));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

for (const required of [
  'src/app/api/learning/me/route.ts',
  'src/app/api/learning/catalog/route.ts',
  'src/app/api/learning/assignments/route.ts',
  'src/app/api/learning/manage/route.ts',
  'src/app/api/learning/studio/courses/route.ts',
  'src/app/learning/manage/page.tsx',
  'src/app/learning/manage/reviews/page.tsx',
  'src/app/learning/manage/reports/page.tsx',
]) assert(exists(required), `${required} must exist`);

const learningService = read('src/lib/learning/learning-service.ts');
assert(learningService.includes('learning-integrity'), 'Learning service must use the version-bound integrity helper.');
for (const mutation of ['recordHeartbeat', 'completeBlock', 'submitQuiz', 'submitAssignment']) {
  const start = learningService.indexOf(`export async function ${mutation}`);
  assert(start >= 0, `${mutation} must exist`);
  const next = learningService.indexOf('export async function ', start + 1);
  const body = learningService.slice(start, next >= 0 ? next : undefined);
  assert(body.includes('assertEnrollmentContentAccess'), `${mutation} must validate enrollment/version content access.`);
}

const assignment = read('src/app/api/learning/assignments/route.ts');
assert(assignment.includes('idempotencyKey'), 'Learning assignment API must accept/use an idempotency key.');
assert(assignment.includes('learning-assignment-service'), 'Learning assignment API must use the atomic assignment service.');

const pathClient = read('src/app/learning/LearningPathsPageClient.tsx');
const assignmentDialog = read('src/app/learning/LearningAssignmentDialog.tsx');
assert(pathClient.includes('LearningAssignmentDialog'), 'Learning Paths must delegate assignment to the atomic assignment dialog.');
assert(assignmentDialog.includes('/api/learning/assignments'), 'Learning assignment dialog must use the atomic batch endpoint.');
assert(!pathClient.includes('Promise.all(assigning.courseIds'), 'Learning Paths must not fan out one enrollment request per course.');
assert(!pathClient.includes('courseIds.map(async'), 'Learning Paths must not fan out one enrollment request per course.');

const courseDialog = read('src/app/learning/CourseCreateDialog.tsx');
assert(courseDialog.includes('/api/learning/studio/courses'), 'Course creation must use the atomic course authoring endpoint.');

const actions = read('src/app/api/learning/studio/actions/route.ts');
assert(actions.includes('expectedUpdatedAt'), 'Assignment review must require expectedUpdatedAt stale-write protection.');
assert(actions.includes('409'), 'Stale assignment review must map to HTTP 409.');

const report = read('src/app/api/learning/studio/report/route.ts');
assert(report.includes('learning-management-service'), 'Learning reports must use the scoped management service.');

const onboarding = read('src/app/learning/onboarding/page.tsx');
assert(onboarding.includes("redirect('/people/onboarding')"), 'Learning onboarding must remain redirect-only.');

for (const route of [
  'src/app/learning/page.tsx',
  'src/app/learning/courses/page.tsx',
  'src/app/learning/paths/page.tsx',
  'src/app/learning/certificates/page.tsx',
]) assert(!read(route).includes('LearningPageClient'), `${route} must not import LearningPageClient`);

assert(!exists('src/app/learning/LearningPageClient.tsx'), 'LearningPageClient must be deleted.');

console.log('Learning end-to-end production regression checks passed.');
