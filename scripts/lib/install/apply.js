'use strict';

const fs = require('fs');
const path = require('path');

const { writeInstallState } = require('../install-state');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function deepMergeJson(baseValue, patchValue) {
  if (!isPlainObject(baseValue) || !isPlainObject(patchValue)) {
    return cloneJsonValue(patchValue);
  }

  return Object.entries(patchValue).reduce((merged, [key, value]) => {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      return {
        ...merged,
        [key]: deepMergeJson(merged[key], value),
      };
    }

    return {
      ...merged,
      [key]: cloneJsonValue(value),
    };
  }, { ...baseValue });
}

function applyOperation(operation) {
  fs.mkdirSync(path.dirname(operation.destinationPath), { recursive: true });

  if (operation.kind === 'copy-file') {
    fs.copyFileSync(operation.sourcePath, operation.destinationPath);
    return;
  }

  if (operation.kind === 'render-template') {
    fs.writeFileSync(operation.destinationPath, operation.renderedContent || '', 'utf8');
    return;
  }

  if (operation.kind === 'merge-json') {
    const currentValue = fs.existsSync(operation.destinationPath)
      ? JSON.parse(fs.readFileSync(operation.destinationPath, 'utf8'))
      : {};
    const mergedValue = deepMergeJson(currentValue, cloneJsonValue(operation.mergePayload || {}));
    fs.writeFileSync(operation.destinationPath, `${JSON.stringify(mergedValue, null, 2)}\n`, 'utf8');
    return;
  }

  if (operation.kind === 'remove') {
    if (fs.existsSync(operation.destinationPath)) {
      fs.rmSync(operation.destinationPath, { recursive: true, force: true });
    }
    return;
  }

  throw new Error(`Unsupported install operation kind: ${operation.kind}`);
}

function applyInstallPlan(plan) {
  for (const operation of plan.operations) {
    applyOperation(operation);
  }

  writeInstallState(plan.installStatePath, plan.statePreview);

  return {
    ...plan,
    applied: true,
  };
}

module.exports = {
  applyInstallPlan,
};
