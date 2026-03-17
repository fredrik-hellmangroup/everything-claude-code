'use strict';

const fs = require('fs');
const { spawnSync } = require('child_process');

const bashPathCache = new Map();
const windowsPathCache = new Map();

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function runBashConversion(command) {
  const result = spawnSync('bash', ['-c', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    return null;
  }

  const output = (result.stdout || '').trim();
  return output.length > 0 ? output : null;
}

function fallbackToBashPath(filePath) {
  return String(filePath)
    .replace(/^([A-Za-z]):/, (_, driveLetter) => `/${driveLetter.toLowerCase()}`)
    .replace(/\\/g, '/');
}

function fallbackFromBashPath(filePath) {
  const normalized = String(filePath);
  const prefixedMatch = normalized.match(/^\/(?:mnt|cygdrive)\/([a-z])(?:\/(.*))?$/i);

  if (normalized.startsWith('//')) {
    return filePath;
  }

  if (prefixedMatch) {
    const [, driveLetter, remainder = ''] = prefixedMatch;
    return `${driveLetter.toUpperCase()}:\\${remainder.replace(/\//g, '\\')}`;
  }

  const bareDriveMatch = normalized.match(/^\/([a-z])(?:\/(.*))?$/i);
  if (!bareDriveMatch) {
    return filePath;
  }

  const [, driveLetter, remainder = ''] = bareDriveMatch;
  const driveRoot = `${driveLetter.toUpperCase()}:\\`;
  if (!fs.existsSync(driveRoot)) {
    return filePath;
  }

  return `${driveRoot}${remainder.replace(/\//g, '\\')}`;
}

function toBashPath(filePath) {
  if (process.platform !== 'win32') {
    return filePath;
  }

  const cacheKey = String(filePath);
  if (bashPathCache.has(cacheKey)) {
    return bashPathCache.get(cacheKey);
  }

  const bashInput = cacheKey.replace(/\\/g, '/');
  const converted =
    runBashConversion(
      `if command -v cygpath >/dev/null 2>&1; then cygpath -u ${shellQuote(bashInput)}; elif command -v wslpath >/dev/null 2>&1; then wslpath -a ${shellQuote(bashInput)}; fi`
    ) || fallbackToBashPath(cacheKey);

  bashPathCache.set(cacheKey, converted);
  return converted;
}

function fromBashPath(filePath) {
  if (process.platform !== 'win32') {
    return filePath;
  }

  const cacheKey = String(filePath);
  if (windowsPathCache.has(cacheKey)) {
    return windowsPathCache.get(cacheKey);
  }

  const converted =
    runBashConversion(
      `if command -v cygpath >/dev/null 2>&1; then cygpath -w ${shellQuote(cacheKey)}; elif command -v wslpath >/dev/null 2>&1; then wslpath -w ${shellQuote(cacheKey)}; fi`
    ) || fallbackFromBashPath(cacheKey);

  windowsPathCache.set(cacheKey, converted);
  return converted;
}

module.exports = {
  fromBashPath,
  toBashPath
};
