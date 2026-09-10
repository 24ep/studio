const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const sourceRoot = path.resolve(process.argv.slice(2).find(argument => !argument.startsWith('--')) || 'src');
const attributes = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'aria-placeholder',
  'aria-valuetext',
  'caption',
  'description',
  'label',
  'placeholder',
  'subtitle',
  'title',
  'tooltip',
]);
const copyProperties = new Set([
  'alt',
  'ariaDescription',
  'ariaLabel',
  'body',
  'caption',
  'content',
  'description',
  'emptyMessage',
  'errorMessage',
  'eyebrow',
  'heading',
  'helpText',
  'label',
  'message',
  'placeholder',
  'subtitle',
  'successMessage',
  'text',
  'title',
  'tooltip',
]);
const copyCalls = new Set([
  'alert',
  'confirm',
  'prompt',
  'setError',
  'setErrorMessage',
  'setMessage',
  'setSuccessMessage',
  'toast',
  'toast.error',
  'toast.loading',
  'toast.success',
  'toast.warning',
]);
const findings = [];
const catalogTerms = new Map();

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return /\.[jt]sx$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [fullPath] : [];
  });
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function propertyName(node, sourceFile) {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return node.getText(sourceFile).replace(/^['"]|['"]$/g, '');
}

function callName(expression, sourceFile) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    return `${callName(expression.expression, sourceFile)}.${expression.name.text}`;
  }
  return expression.getText(sourceFile);
}

function staticCopy(node) {
  if (!node) return null;
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
    return staticCopy(node.expression);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    node.templateSpans.forEach((span, index) => {
      value += `{${index}}${span.literal.text}`;
    });
    return value;
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticCopy(node.left);
    const right = staticCopy(node.right);
    if (left != null && right != null) return `${left}${right}`;
    if (left != null) return `${left}{0}`;
    if (right != null) return `{0}${right}`;
  }
  return null;
}

function addStaticBranches(sourceFile, node, kind) {
  if (!node) return;
  if (ts.isConditionalExpression(node)) {
    addStaticBranches(sourceFile, node.whenTrue, kind);
    addStaticBranches(sourceFile, node.whenFalse, kind);
    return;
  }
  const value = staticCopy(node);
  if (value != null) add(sourceFile, node, kind, value);
}

function add(sourceFile, node, kind, value) {
  const text = normalize(value);
  if (!text || !/[A-Za-z]/.test(text) || /^[A-Za-z]$/.test(text)) return;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  findings.push({ file: path.relative(process.cwd(), sourceFile.fileName).replace(/\\/g, '/'), line, kind, text });
}

for (const file of walk(sourceRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isJsxText(node)) add(sourceFile, node, 'jsx-text', node.getText(sourceFile));
    if (ts.isJsxExpression(node) && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      addStaticBranches(sourceFile, node.expression, 'jsx-expression');
    }
    if (ts.isJsxAttribute(node) && attributes.has(node.name.getText(sourceFile)) && node.initializer) {
      const valueNode = ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer;
      addStaticBranches(sourceFile, valueNode, `attribute:${node.name.getText(sourceFile)}`);
    }
    if (ts.isPropertyAssignment(node) && copyProperties.has(propertyName(node.name, sourceFile))) {
      addStaticBranches(sourceFile, node.initializer, `property:${propertyName(node.name, sourceFile)}`);
    }
    if (ts.isCallExpression(node)) {
      const name = callName(node.expression, sourceFile);
      if (copyCalls.has(name)) addStaticBranches(sourceFile, node.arguments[0], `call:${name}`);
      if ((name === 't' || name.endsWith('.t')) && node.arguments.length > 1) {
        addStaticBranches(sourceFile, node.arguments[1], 'translation-fallback');
        const key = staticCopy(node.arguments[0]);
        const fallback = staticCopy(node.arguments[1]);
        if (key && fallback && /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/i.test(key)) {
          const normalizedFallback = normalize(fallback);
          if (normalizedFallback) {
            const existing = catalogTerms.get(key);
            if (existing && existing.translation !== normalizedFallback) {
              existing.conflicts.push({ file: path.relative(process.cwd(), sourceFile.fileName).replace(/\\/g, '/'), fallback: normalizedFallback });
            } else if (!existing) {
              catalogTerms.set(key, {
                key,
                label: normalizedFallback,
                translation: normalizedFallback,
                translations: { en: normalizedFallback },
                description: `UI copy from ${path.relative(process.cwd(), sourceFile.fileName).replace(/\\/g, '/')}`,
                conflicts: [],
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
const uniqueCopy = new Set(findings.map(item => item.text));
const files = new Set(findings.map(item => item.file));
const summary = { sourceRoot: path.relative(process.cwd(), sourceRoot).replace(/\\/g, '/'), findings: findings.length, uniqueCopy: uniqueCopy.size, files: files.size };
const payloadArgument = process.argv.find(argument => argument.startsWith('--appkit-payload='));
const quiet = process.argv.includes('--quiet');

if (payloadArgument) {
  const outputPath = path.resolve(payloadArgument.slice('--appkit-payload='.length));
  const terms = [...catalogTerms.values()]
    .sort((left, right) => left.key.localeCompare(right.key))
    .map(({ conflicts, ...term }) => term);
  fs.writeFileSync(outputPath, JSON.stringify({ languageCode: 'en', packageId: 'core-copy', terms }, null, 2));
}

if (process.argv.includes('--json')) console.log(JSON.stringify({ summary, findings }, null, 2));
else if (quiet) console.log(JSON.stringify(summary));
else {
  console.log(JSON.stringify(summary));
  for (const item of findings) console.log(`${item.file}:${item.line}\t${item.kind}\t${item.text}`);
}
