const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sourceFile = process.argv[2];
const outputDir = process.argv[3] || path.join(process.cwd(), 'prompt-config');

if (!sourceFile) {
  console.error('Usage: node scripts/extract-system-prompts.js <workflow.json> [output-dir]');
  process.exit(1);
}

const workflow = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

function slugify(value) {
  return value
    .replace(/^[= \t]+/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('-')
    .toLowerCase();
}

function hashPrompt(prompt) {
  return crypto.createHash('sha1').update(prompt).digest('hex').slice(0, 10);
}

function looksLikeSystemPrompt(value) {
  return (
    typeof value === 'string' &&
    value.length > 500 &&
    /(You are|Role & Objective|<instruction>|<task_description>)/i.test(value)
  );
}

function findSystemPromptRefs(node) {
  const refs = [];

  function walk(value, pathParts, parent) {
    if (!value || typeof value !== 'object') return;

    if (Array.isArray(value)) {
      value.forEach((entry, index) => walk(entry, pathParts.concat(index), value));
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const childPath = pathParts.concat(key);
      const isSystemRoleContent = key === 'content' && value.role === 'system';
      const isKnownSystemField =
        key === 'systemMessage' ||
        (key === 'message' && pathParts.join('.').includes('messages.messageValues'));
      const isGeminiDocumentPrompt =
        key === 'text' && node.type === '@n8n/n8n-nodes-langchain.googleGemini';

      if (
        looksLikeSystemPrompt(child) &&
        (isSystemRoleContent || isKnownSystemField || isGeminiDocumentPrompt)
      ) {
        refs.push({
          path: childPath.join('.'),
          prompt: child,
          sourceKind: isSystemRoleContent
            ? 'system-role-content'
            : isGeminiDocumentPrompt
              ? 'document-text-prompt'
              : 'system-prompt-field',
        });
      }

      walk(child, childPath, value);
    }
  }

  walk(node.parameters || {}, ['parameters'], null);
  return refs;
}

function setByPath(root, dottedPath, nextValue) {
  const parts = dottedPath.split('.');
  let cursor = root;
  for (let index = 0; index < parts.length - 1; index += 1) {
    cursor = cursor[parts[index]];
  }
  cursor[parts[parts.length - 1]] = nextValue;
}

const promptByHash = new Map();
const nodeSystemPromptConfig = [];

for (const node of workflow.nodes || []) {
  for (const ref of findSystemPromptRefs(node)) {
    const promptHash = hashPrompt(ref.prompt);
    if (!promptByHash.has(promptHash)) {
      const baseSlug = slugify(ref.prompt) || slugify(node.name) || 'system-prompt';
      promptByHash.set(promptHash, {
        key: `${baseSlug}-${promptHash}`,
        prompt: ref.prompt,
        usedBy: [],
      });
    }

    const promptRecord = promptByHash.get(promptHash);
    promptRecord.usedBy.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      sourcePath: ref.path,
    });

    nodeSystemPromptConfig.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      systemPromptKey: promptRecord.key,
      sourcePath: ref.path,
      sourceKind: ref.sourceKind,
    });
  }
}

const defaultSystemPrompts = {};
for (const promptRecord of promptByHash.values()) {
  defaultSystemPrompts[promptRecord.key] = {
    prompt: promptRecord.prompt,
    usedBy: promptRecord.usedBy,
  };
}

const config = {
  workflowName: workflow.name,
  sourceFile,
  extractedAt: new Date().toISOString(),
  defaultSystemPrompts,
  nodeSystemPromptConfig,
};

const workflowForBuild = JSON.parse(JSON.stringify(workflow));
for (const node of workflowForBuild.nodes || []) {
  const nodeRefs = nodeSystemPromptConfig.filter((entry) => entry.nodeId === node.id);
  if (!nodeRefs.length) continue;

  node.systemPromptConfig = nodeRefs.map((entry) => ({
    systemPromptKey: entry.systemPromptKey,
    sourcePath: entry.sourcePath,
    sourceKind: entry.sourceKind,
  }));

  for (const entry of nodeRefs) {
    setByPath(node, entry.sourcePath, `={{ $json.defaultSystemPrompts["${entry.systemPromptKey}"] }}`);
  }
}

fs.mkdirSync(outputDir, { recursive: true });

const configPath = path.join(outputDir, 'fitscan-system-prompts.default.json');
const workflowPath = path.join(outputDir, 'FitScan-process-candidate-PROD.system-prompt-config.json');

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
fs.writeFileSync(workflowPath, JSON.stringify(workflowForBuild, null, 2), 'utf8');

console.log(JSON.stringify({
  promptCount: Object.keys(defaultSystemPrompts).length,
  nodeConfigCount: nodeSystemPromptConfig.length,
  configPath,
  workflowPath,
}, null, 2));
