const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { compile } = require('../lib');

const fixturesDir = path.resolve(__dirname, '../tests/jsvmp/compat_fixtures');
const outDir = path.resolve(__dirname, '../outsrc/fixture-check');
fs.mkdirSync(outDir, { recursive: true });

function runNode(file) {
  const result = spawnSync(process.execPath, [file], { encoding: 'utf8' });
  return {
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

const files = fs.readdirSync(fixturesDir).filter(name => name.endsWith('.js')).sort();
const summary = [];
let failed = false;

for (const file of files) {
  const input = path.join(fixturesDir, file);
  const output = path.join(outDir, file.replace(/\.js$/, '.compiled.js'));
  compile(input, { profile: 'fast', outputFile: output, sourceFileName: file });

  const original = runNode(input);
  const compiled = runNode(output);
  const ok = original.status === 0 && compiled.status === 0 && original.stdout === compiled.stdout;
  if (!ok) failed = true;
  summary.push({ file, ok, original, compiled });
}

console.log(JSON.stringify(summary, null, 2));
process.exit(failed ? 1 : 0);
