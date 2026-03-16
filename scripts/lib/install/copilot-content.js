'use strict';

const fs = require('fs');
const path = require('path');

function normalizeMarkdown(text) {
  return `${String(text || '').replace(/\r\n/g, '\n').trim()}\n`;
}

function readRequiredFile(sourceRoot, relativePath) {
  const absolutePath = path.join(sourceRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing Copilot source file: ${relativePath}`);
  }

  return normalizeMarkdown(fs.readFileSync(absolutePath, 'utf8'));
}

function stripFirstHeading(markdown) {
  return normalizeMarkdown(markdown).replace(/^# .+\n+/, '');
}

function extractSection(markdown, heading) {
  const normalized = normalizeMarkdown(markdown);
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^## ${escapedHeading}\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm');
  const match = normalized.match(pattern);
  return match ? match[1].trim() : '';
}

function toInstructionBullets(sectionText) {
  return sectionText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- ') || /^\d+\.\s/.test(line))
    .map(line => line.replace(/^\d+\.\s/, '- '));
}

function buildCopilotInstructionBody(skillMarkdown, supplementMarkdown) {
  const whenToUse = toInstructionBullets(extractSection(skillMarkdown, 'When to Use'));
  const howItWorks = toInstructionBullets(extractSection(skillMarkdown, 'How It Works'));
  const supplementBody = stripFirstHeading(supplementMarkdown).trim();

  const lines = [
    '# Everything Copilot Code',
    '',
    'These local instructions adapt ECC guidance for GitHub Copilot CLI.',
    '',
    '## How to Apply ECC in Copilot',
    '- Use these instructions as the local ECC baseline when a repository does not already provide stronger repo-specific Copilot instructions.',
    '- Prefer repository `AGENTS.md` and `.github` Copilot instructions when they exist; combine them with this file instead of replacing them.',
    '- Treat ECC guidance as workflow and quality guidance, not as permission to ignore repository-local conventions.',
  ];

  if (whenToUse.length > 0) {
    lines.push('', '## Activate ECC Guidance When', ...whenToUse);
  }

  if (howItWorks.length > 0) {
    lines.push('', '## Core ECC Working Style', ...howItWorks);
  }

  if (supplementBody) {
    lines.push('', '## GitHub Copilot Supplement', supplementBody);
  }

  return `${lines.join('\n')}\n`;
}

function buildMergedAgentsMarkdown(rootAgentsMarkdown, supplementMarkdown) {
  const mergedSupplement = stripFirstHeading(supplementMarkdown).trim();
  return `${normalizeMarkdown(rootAgentsMarkdown).trimEnd()}\n\n## GitHub Copilot Supplement\n\n${mergedSupplement}\n`;
}

function buildCopilotInstallArtifacts(sourceRoot) {
  const rootAgentsMarkdown = readRequiredFile(sourceRoot, 'AGENTS.md');
  const supplementMarkdown = readRequiredFile(sourceRoot, 'AGENTS.copilot.md');
  const skillMarkdown = readRequiredFile(
    sourceRoot,
    path.join('.claude', 'skills', 'everything-claude-code', 'SKILL.md')
  );
  const instructionMarkdown = buildCopilotInstructionBody(skillMarkdown, supplementMarkdown);

  return {
    agentsMarkdown: buildMergedAgentsMarkdown(rootAgentsMarkdown, supplementMarkdown),
    instructionMarkdown,
  };
}

module.exports = {
  buildCopilotInstallArtifacts,
};
