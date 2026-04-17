const fs = require("fs");
const path = require("path");

function ensureDirectory(dirPath) {
  if (!dirPath) {
    return;
  }
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function listJavaScriptFiles(inputDir) {
  const resolvedDir = path.resolve(inputDir);
  const results = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.js')) {
        results.push(fullPath);
      }
    }
  }

  walk(resolvedDir);
  return results.sort();
}

function resolveOutputFile(inputFile, inputDir, outputDir) {
  const relativePath = path.relative(path.resolve(inputDir), path.resolve(inputFile));
  return path.join(path.resolve(outputDir), relativePath);
}

function timestampLabel() {
  return new Date().toISOString().replace(/[.:]/g, '-');
}

module.exports = {
  ensureDirectory,
  listJavaScriptFiles,
  resolveOutputFile,
  timestampLabel,
};
