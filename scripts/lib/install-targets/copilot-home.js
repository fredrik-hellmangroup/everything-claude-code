const path = require('path');

const { buildCopilotInstallArtifacts } = require('../install/copilot-content');
const {
  createInstallTargetAdapter,
  createManagedOperation,
} = require('./helpers');

module.exports = createInstallTargetAdapter({
  id: 'copilot-home',
  target: 'copilot',
  kind: 'home',
  rootSegments: ['.copilot'],
  installStatePathSegments: ['ecc', 'install-state.json'],
  planOperations(input, adapter) {
    const modules = Array.isArray(input.modules) ? input.modules : [];
    if (!modules.some(module => module.id === 'copilot-runtime')) {
      return [];
    }

    const artifacts = buildCopilotInstallArtifacts(input.repoRoot || '');
    const targetRoot = adapter.resolveRoot(input);

    return [
      createManagedOperation({
        kind: 'render-template',
        moduleId: 'copilot-runtime',
        sourceRelativePath: 'AGENTS.copilot.md',
        destinationPath: path.join(targetRoot, 'AGENTS.md'),
        strategy: 'render-template',
        ownership: 'managed',
        scaffoldOnly: false,
        renderedContent: artifacts.agentsMarkdown,
      }),
      createManagedOperation({
        kind: 'render-template',
        moduleId: 'copilot-runtime',
        sourceRelativePath: path.join('.claude', 'skills', 'everything-claude-code', 'SKILL.md'),
        destinationPath: path.join(targetRoot, 'copilot-instructions.md'),
        strategy: 'render-template',
        ownership: 'managed',
        scaffoldOnly: false,
        renderedContent: artifacts.instructionMarkdown,
      }),
      createManagedOperation({
        kind: 'render-template',
        moduleId: 'copilot-runtime',
        sourceRelativePath: path.join('.claude', 'skills', 'everything-claude-code', 'SKILL.md'),
        destinationPath: path.join(
          targetRoot,
          'skills',
          'everything-copilot-code',
          'INSTRUCTION.md'
        ),
        strategy: 'render-template',
        ownership: 'managed',
        scaffoldOnly: false,
        renderedContent: artifacts.instructionMarkdown,
      }),
    ];
  },
});
