#!/usr/bin/env node

const path = require("path");
const { compile, analyzeInput, buildCompileReport, PROFILE_DEFINITIONS, DEFAULT_PROFILE } = require("./lib");
const { startServer } = require("./lib/service/http-server");

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
  analyze <input> [--profile ${DEFAULT_PROFILE}]
  serve [--port 3000]

Profiles:
  ${Object.keys(PROFILE_DEFINITIONS).join(", ")}
`);
}

function runBuild(inputFile, options) {
  const result = compile(path.resolve(inputFile), options);
  console.log(JSON.stringify(buildCompileReport(result), null, 2));
}

function runAnalyze(inputFile, options) {
  const result = analyzeInput(path.resolve(inputFile), options);
  console.log(JSON.stringify(result, null, 2));
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

  if ((command === "build" || command === "analyze") && positionals.length === 0) {
    throw new Error(`${command} 需要输入文件路径`);
  }

  if (command === "build") {
    runBuild(positionals[0], options);
    return;
  }

  if (command === "analyze") {
    runAnalyze(positionals[0], options);
    return;
  }

  printHelp();
}

main();
