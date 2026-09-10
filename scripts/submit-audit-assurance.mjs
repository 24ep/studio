const endpoint = process.env.AUDIT_ASSURANCE_URL;
const apiKey = process.env.AUTOMATION_API_KEY || process.env.PROCESSOR_API_KEY;
const kind = process.env.AUDIT_ASSURANCE_KIND || 'change_release';
const reference = process.env.AUDIT_ASSURANCE_REFERENCE || process.env.CI_COMMIT_SHA || process.env.GIT_COMMIT || process.env.BUILD_TAG;
const status = process.env.AUDIT_ASSURANCE_STATUS || 'passed';

if (!endpoint || !apiKey || !reference) {
  console.error('AUDIT_ASSURANCE_URL, AUTOMATION_API_KEY, and AUDIT_ASSURANCE_REFERENCE (or a CI commit variable) are required.');
  process.exit(2);
}

const payload = {
  kind,
  reference,
  status,
  occurredAt: new Date().toISOString(),
  payload: {
    pipelineUrl: process.env.CI_PIPELINE_URL || process.env.BUILD_URL || null,
    commit: process.env.CI_COMMIT_SHA || process.env.GIT_COMMIT || null,
    image: process.env.CI_REGISTRY_IMAGE && process.env.IMAGE_TAG ? `${process.env.CI_REGISTRY_IMAGE}:${process.env.IMAGE_TAG}` : null,
    environment: process.env.CI_ENVIRONMENT_NAME || process.env.DEPLOYMENT_ENVIRONMENT || null,
    actor: process.env.GITLAB_USER_LOGIN || process.env.BUILD_USER_ID || null,
    source: 'ci',
  },
};

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  console.error(`Audit assurance submission failed (${response.status}): ${await response.text()}`);
  process.exit(1);
}

const result = await response.json();
console.log(`Audit assurance recorded for ${kind} ${reference}: ${result?.result?.checksum || 'accepted'}`);
