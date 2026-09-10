const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(process.argv[2] || 'src');
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const excluded = /(?:^|[\\/])(?:api|__tests__|swagger)(?:[\\/])|\.(?:test|spec)\.[jt]sx?$/;
const textAttributes = new Set([
  'alt', 'aria-description', 'aria-label', 'aria-placeholder', 'aria-valuetext',
  'description', 'emptyDescription', 'emptyMessage', 'helperText', 'label',
  'message', 'placeholder', 'subtitle', 'title', 'tooltip',
]);
const ignoredAttributes = new Set(['className', 'href', 'id', 'key', 'name', 'src', 'type', 'value']);

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else if (extensions.has(path.extname(file)) && !excluded.test(file)) output.push(file);
  }
  return output;
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function looksLikeCopy(value) {
  const text = clean(value);
  if (!text || text.length < 2 || text.length > 1000 || !/[A-Za-z]/.test(text)) return false;
  if (/^(?:https?:|\/|#|\.|[a-z-]+\/[a-z-]+$)/i.test(text)) return false;
  if (/^(?:flex|grid|block|inline|hidden|relative|absolute|fixed|sticky)(?:\s|$)/.test(text)) return false;
  if (/^[a-z][\w.-]*(?:\.[a-z][\w.-]*)+$/.test(text) && !/\s/.test(text)) return false;
  if (/^[A-Z0-9_]{3,}$/.test(text)) return false;
  return true;
}

const found = new Map();
function add(value, file, node, sourceFile, kind, semanticKey) {
  const label = clean(value);
  if (!looksLikeCopy(label)) return;
  const key = `${semanticKey || ''}\u0000${label}`;
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  if (!found.has(key)) found.set(key, {
    semanticKey: semanticKey || null,
    label,
    kind,
    file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
    line: location.line + 1,
  });
}

for (const file of walk(root)) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true,
    /x$/.test(path.extname(file)) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  function visit(node) {
    if (ts.isJsxText(node)) add(node.text, file, node, sourceFile, 'jsx');

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (!ignoredAttributes.has(name) && textAttributes.has(name) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) add(node.initializer.text, file, node, sourceFile, `attr:${name}`);
        else if (ts.isJsxExpression(node.initializer) && node.initializer.expression &&
          (ts.isStringLiteral(node.initializer.expression) || ts.isNoSubstitutionTemplateLiteral(node.initializer.expression))) {
          add(node.initializer.expression.text, file, node, sourceFile, `attr:${name}`);
        }
      }
    }

    if (ts.isCallExpression(node) && node.arguments.length) {
      const callee = node.expression.getText(sourceFile);
      if (/^(?:t|localize)$/.test(callee) && ts.isStringLiteralLike(node.arguments[0])) {
        const fallback = node.arguments[1];
        if (fallback && ts.isStringLiteralLike(fallback)) {
          add(fallback.text, file, node, sourceFile, 'semantic', node.arguments[0].text);
        }
      } else if (/^(?:toast(?:\.(?:success|error|loading|custom))?|alert)$/.test(callee)) {
        const value = node.arguments[0];
        if (value && ts.isStringLiteralLike(value)) add(value.text, file, node, sourceFile, 'notification');
      }
    }

    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      node.parent && ts.isConditionalExpression(node.parent) &&
      node.parent.parent && ts.isJsxExpression(node.parent.parent)) {
      const attribute = node.parent.parent.parent;
      if (!ts.isJsxAttribute(attribute) || !ignoredAttributes.has(attribute.name.getText(sourceFile))) {
        add(node.text, file, node, sourceFile, 'conditional');
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

async function loadStoredCatalog() {
  for (const envFile of ['.env.local', '.env']) {
    const fullPath = path.resolve(envFile);
    if (!fs.existsSync(fullPath)) continue;
    for (const line of fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (match && process.env[match[1]] == null) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for --compare-stored');
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query('SELECT value FROM "SystemSetting" WHERE key = $1 LIMIT 1', ['appkitLocalizationConfig']);
    const snapshot = JSON.parse(result.rows[0]?.value || '{}');
    return snapshot.config || {};
  } finally {
    await client.end();
  }
}

async function main() {
  const values = [...found.values()];
  if (process.argv.includes('--compare-stored')) {
    const config = await loadStoredCatalog();
    const keys = new Set();
    const labels = new Set();
    const normalize = value => clean(value).toLocaleLowerCase();
    for (const translations of Object.values(config.translations || {})) {
      for (const [key, value] of Object.entries(translations || {})) {
        keys.add(key);
        labels.add(normalize(value));
      }
    }
    for (const keyword of config.packages?.find(item => item.id === config.activePackageId)?.keywords || []) {
      if (keyword.key) keys.add(keyword.key);
      if (keyword.label) labels.add(normalize(keyword.label));
      for (const value of Object.values(keyword.translations || {})) labels.add(normalize(value));
    }
    const missing = values.filter(item =>
      !(item.semanticKey && keys.has(item.semanticKey)) && !labels.has(normalize(item.label)));
    const missingOffsetArg = process.argv.find(value => value.startsWith('--missing-offset='));
    const missingLimitArg = process.argv.find(value => value.startsWith('--missing-limit='));
    const missingOffset = Math.max(0, Number(missingOffsetArg?.split('=')[1]) || 0);
    const missingLimit = Math.max(1, Number(missingLimitArg?.split('=')[1]) || missing.length || 1);
    process.stdout.write(JSON.stringify({
      total: values.length,
      missingCount: missing.length,
      missing: missing.slice(missingOffset, missingOffset + missingLimit),
    }));
    return;
  }
  const offset = Math.max(0, Number(process.argv[3]) || 0);
  const limit = Math.max(1, Number(process.argv[4]) || found.size || 1);
  process.stdout.write(JSON.stringify({ total: values.length, items: values.slice(offset, offset + limit) }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
