const fs = require("fs");
const path = require("path");
const { normalizeSource } = require("./core/normalize");
const { resolveProfile, PROFILE_DEFINITIONS, DEFAULT_PROFILE } = require("./core/profiles");
const { buildCompileReport } = require("./core/report");
const { compileWithLegacyEngine } = require("./engines/legacy");

function readInput(input) {
  if (typeof input !== "string") {
    throw new Error("compile() 需要字符串源码或文件路径");
  }
  if (fs.existsSync(input) && fs.statSync(input).isFile()) {
    return {
      source: fs.readFileSync(input, "utf8"),
      sourceFileName: path.basename(input),
      inputFile: path.resolve(input),
    };
  }
  return {
    source: input,
    sourceFileName: "inline-input.js",
    inputFile: null,
  };
}

function analyzeInput(input, options) {
  const runtimeOptions = options || {};
  const loaded = readInput(input);
  const profile = resolveProfile(runtimeOptions.profile, runtimeOptions.profileOverrides);
  const normalized = normalizeSource(loaded.source);
  return {
    ok: true,
    mode: "analyze",
    profile: profile.name,
    engine: profile.engine,
    inputFile: loaded.inputFile,
    warnings: normalized.warnings,
    features: normalized.features,
    normalizedCodeLength: normalized.code.length,
  };
}

function compile(input, options) {
  const runtimeOptions = options || {};
  const loaded = readInput(input);
  const profile = resolveProfile(runtimeOptions.profile, runtimeOptions.profileOverrides);
  const normalized = normalizeSource(loaded.source);

  const outputFile = runtimeOptions.outputFile ? path.resolve(runtimeOptions.outputFile) : null;
  const code = compileWithLegacyEngine({
    source: normalized.code,
    sourceFileName: runtimeOptions.sourceFileName || loaded.sourceFileName,
    outputFile,
    profile,
    seed: runtimeOptions.seed,
  });

  return {
    ok: true,
    mode: "compile",
    profile: profile.name,
    engine: profile.engine,
    seed: runtimeOptions.seed || null,
    inputFile: loaded.inputFile,
    outputFile,
    warnings: normalized.warnings,
    features: normalized.features,
    code,
  };
}

module.exports = {
  compile,
  analyzeInput,
  buildCompileReport,
  PROFILE_DEFINITIONS,
  DEFAULT_PROFILE,
};
