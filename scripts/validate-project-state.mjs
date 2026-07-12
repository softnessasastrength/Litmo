import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'CURRENT_STATE.md',
  'TASKS.md',
  'DECISIONS.md',
  'project-state.json',
  'docs/project-state.schema.json',
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required handoff file: ${file}`);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(path.join(root, 'project-state.json'), 'utf8'));
} catch (error) {
  errors.push(`project-state.json is not valid JSON: ${error.message}`);
}

if (state) {
  const statuses = new Set(['pending', 'active', 'blocked', 'completed', 'abandoned']);
  const verificationStatuses = new Set(['pending', 'passed', 'failed', 'partial']);

  if (state.version !== 1) errors.push('project-state.json version must be 1');
  if (!state.updatedAt || Number.isNaN(Date.parse(state.updatedAt))) errors.push('updatedAt must be a parseable timestamp');
  if (!state.milestone?.id) errors.push('milestone.id is required');
  if (!state.milestone?.name) errors.push('milestone.name is required');
  if (!statuses.has(state.milestone?.status)) errors.push('milestone.status is invalid');
  if (!state.git?.branch) errors.push('git.branch is required');
  if (!state.git?.latestCoherentCommit || state.git.latestCoherentCommit.length < 7) errors.push('git.latestCoherentCommit must identify a commit');
  if (typeof state.git?.workingTreeExpectedClean !== 'boolean') errors.push('git.workingTreeExpectedClean must be boolean');
  if (!verificationStatuses.has(state.verification?.status)) errors.push('verification.status is invalid');
  if (!Array.isArray(state.verification?.commands)) errors.push('verification.commands must be an array');
  if (!Array.isArray(state.verification?.failures)) errors.push('verification.failures must be an array');
  if (!state.nextAction?.trim()) errors.push('nextAction must be non-empty');
  for (const key of ['blockedBy', 'risks', 'notes']) {
    if (!Array.isArray(state[key])) errors.push(`${key} must be an array`);
  }
}

const currentState = fs.existsSync(path.join(root, 'CURRENT_STATE.md'))
  ? fs.readFileSync(path.join(root, 'CURRENT_STATE.md'), 'utf8')
  : '';

for (const heading of ['## Active milestone', '## Verification', '## Exact next action', '## Resume checklist', '## Stop checklist']) {
  if (!currentState.includes(heading)) errors.push(`CURRENT_STATE.md is missing heading: ${heading}`);
}

if (errors.length) {
  console.error('Project-state validation failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Project-state validation passed.');
