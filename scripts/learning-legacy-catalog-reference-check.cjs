const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const catalogPath = path.join(root, 'src/app/learning/CourseCatalog.tsx');
const legacyPath = path.join(root, 'src/app/learning/LegacyCourseCatalog.tsx');
const oldClientPath = path.join(root, 'src/app/learning/LearningPageClient.tsx');

const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(fs.existsSync(catalogPath), 'Production CourseCatalog must exist.');
assert(!fs.existsSync(oldClientPath), 'Legacy LearningPageClient must remain retired.');

const catalog = fs.readFileSync(catalogPath, 'utf8');
assert(!catalog.includes('LegacyCourseCatalog'), 'Production CourseCatalog must not depend on LegacyCourseCatalog.');
assert(!catalog.includes('CourseGrid('), 'Production CourseCatalog must not reintroduce the legacy CourseGrid subtree.');
assert(!catalog.includes('CourseList('), 'Production CourseCatalog must not reintroduce the legacy CourseList subtree.');

if (fs.existsSync(legacyPath)) {
  const legacy = fs.readFileSync(legacyPath, 'utf8');
  assert(legacy.includes('LegacyCourseCatalog'), 'Legacy fallback file must remain self-contained if retained.');
}

console.log('Legacy Learning catalog reference check passed: production catalog is independent.');
