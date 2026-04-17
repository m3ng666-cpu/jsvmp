#!/usr/bin/env node

const path = require("path");
const { compile, analyzeInput, buildCompileReport, PROFILE_DEFINITIONS, DEFAULT_PROFILE } = require("./lib");
const { startServer } = require("./lib/service/http-server");
const { buildDirectoryTarget, buildFromConfig } = require("./lib/pipeline/batch");

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() || "help";
  const options = {};
  const positionals = [];

  while (args.length > 0) {
    const current = args.shift();
    if (current === "-o" || current === "--output") {
      options.outputFile = args.shift();
      continue;
    }
    if (current === "--out-dir") {
      options.outputDir = args.shift();
      continue;
    }
    if (current === "-p" || current === "--profile") {
      options.profile = args.shift();
      continue;
    }
    if (current === "--seed") {
      options.seed = args.shift();
      continue;
    }
    if (current === "--port") {
      options.port = Number(args.shift());
      continue;
    }
    positionals.push(current);
  }

  return { command, options, positionals };
}

function printHelp() {
  console.log(`JSVMP CLI

Commands:
  build <input> [-o output.js] [--profile ${DEFAULT_PROFILE}] [--seed value]
  build-dir <inputDir> [--out-dir dir] [--profile ${DEFAULT_PROFILE}] [--seed value]
  build-config <configFile>
  analyze <input> [--profile ${DEFAULT_PROFILE}]
  profiles
  serve [--port 3000]

Profiles:
  ${Object.keys(PROFILE_DEFINITIONS).join(", ")}
`);
}

function runBuild(inputFile, options) {
  const result = compile(path.resolve(inputFile), options);
  console.log(JSON.stringify(buildCompileReport(result), null, 2));
}

function runBuildDir(inputDir, options) {
  const result = buildDirectoryTarget({
    inputDir: path.resolve(inputDir),
    outputDir: path.resolve(options.outputDir || './outsrc/batch'),
    profile: options.profile,
    seed: options.seed,
  });
  console.log(JSON.stringify(result, null, 2));
}

function runBuildConfig(configFile) {
  const result = buildFromConfig(path.resolve(configFile));
  console.log(JSON.stringify(result, null, 2));
}

function runAnalyze(inputFile, options) {
  const result = analyzeInput(path.resolve(inputFile), options);
  console.log(JSON.stringify(result, null, 2));
}

function runProfiles() {
  console.log(JSON.stringify({
    defaultProfile: DEFAULT_PROFILE,
    profiles: PROFILE_DEFINITIONS,
  }, null, 2));
}

function main() {
  const { command, options, positionals } = parseArgs(process.argv.slice(2));

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "serve") {
    startServer({ port: options.port });
    return;
  }

  if (command === "profiles") {
    runProfiles();
    return;
  }

  if (command === "build") {
    if (positionals.length === 0) {
      throw new Error("build 需要输入文件路径");
    }
    runBuild(positionals[0], options);
    return;
  }

  if (command === "build-dir") {
    if (positionals.length === 0) {
      throw new Error("build-dir 需要输入目录路径");
    }
    runBuildDir(positionals[0], options);
    return;
  }

  if (command === "build-config") {
    if (positionals.length === 0) {
      throw new Error("build-config 需要配置文件路径");
    }
    runBuildConfig(positionals[0]);
    return;
  }

  if (command === "analyze") {
    if (positionals.length === 0) {
      throw new Error("analyze 需要输入文件路径");
    }
    runAnalyze(positionals[0], options);
    return;
  }

  printHelp();
}

main();
