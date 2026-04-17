const fs = require("fs");
const path = require("path");
const { compile, buildCompileReport } = require("../index");
const { ensureDirectory, listJavaScriptFiles, resolveOutputFile, timestampLabel } = require("../core/files");

function writeManifest(targetPath, payload) {
  ensureDirectory(path.dirname(targetPath));
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2));
}

function resolveMaybeRelative(baseDir, targetPath) {
  if (!targetPath) {
    return targetPath;
  }
  if (path.isAbsolute(targetPath)) {
    return targetPath;
  }
  return path.resolve(baseDir, targetPath);
}

function compileFileTarget(target, baseDir) {
  const inputFile = resolveMaybeRelative(baseDir, target.input);
  const outputFile = resolveMaybeRelative(baseDir, target.output);
  ensureDirectory(path.dirname(outputFile));
  const result = compile(inputFile, {
    profile: target.profile,
    seed: target.seed,
    outputFile,
  });
  return buildCompileReport(result);
}

function buildDirectoryTarget(target) {
  const inputDir = path.resolve(target.inputDir);
  const outputDir = path.resolve(target.outputDir);
  ensureDirectory(outputDir);

  const files = listJavaScriptFiles(inputDir);
  const reports = files.map(inputFile => {
    const outputFile = resolveOutputFile(inputFile, inputDir, outputDir);
    ensureDirectory(path.dirname(outputFile));
    const result = compile(inputFile, {
      profile: target.profile,
      seed: target.seed,
      outputFile,
    });
    return buildCompileReport(result);
  });

  const manifestFile = path.join(outputDir, `manifest-${timestampLabel()}.json`);
  const manifest = {
    ok: true,
    mode: 'build-dir',
    inputDir,
    outputDir,
    profile: target.profile || null,
    seed: target.seed || null,
    fileCount: reports.length,
    reports,
  };
  writeManifest(manifestFile, manifest);
  return {
    ...manifest,
    manifestFile,
  };
}

function buildDirectoryTargetFromConfig(target, baseDir) {
  return buildDirectoryTarget({
    inputDir: resolveMaybeRelative(baseDir, target.inputDir),
    outputDir: resolveMaybeRelative(baseDir, target.outputDir),
    profile: target.profile,
    seed: target.seed,
  });
}

function buildFromConfig(configPath) {
  const resolvedConfig = path.resolve(configPath);
  const configDir = path.dirname(resolvedConfig);
  const raw = fs.readFileSync(resolvedConfig, 'utf8');
  const config = JSON.parse(raw);
  const fileTargets = Array.isArray(config.targets) ? config.targets : [];
  const directoryTargets = Array.isArray(config.directoryTargets) ? config.directoryTargets : [];

  const fileReports = fileTargets.map(target => compileFileTarget(target, configDir));
  const directoryReports = directoryTargets.map(target => buildDirectoryTargetFromConfig(target, configDir));
  const manifestFile = resolveMaybeRelative(configDir, config.manifestFile || `./outsrc/manifests/config-build-${timestampLabel()}.json`);
  const manifest = {
    ok: true,
    mode: 'build-config',
    configFile: resolvedConfig,
    fileTargetCount: fileReports.length,
    directoryTargetCount: directoryReports.length,
    fileReports,
    directoryReports,
  };
  writeManifest(manifestFile, manifest);
  return {
    ...manifest,
    manifestFile,
  };
}

module.exports = {
  compileFileTarget,
  buildDirectoryTarget,
  buildFromConfig,
};
