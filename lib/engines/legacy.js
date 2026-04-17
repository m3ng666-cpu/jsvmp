const fs = require("fs");
const path = require("path");
const { withPatchedRandom } = require("../core/random");

const projectRoot = path.resolve(__dirname, "../..");
const ENGINE_MODULES = {
  basic: path.join(projectRoot, "main.js"),
  fast: path.join(projectRoot, "jiajianbian.js"),
  hardened: path.join(projectRoot, "jiamian.js"),
  threaded: path.join(projectRoot, "main_pro.js"),
};

function withProjectRoot(executor) {
  const previousCwd = process.cwd();
  process.chdir(projectRoot);
  try {
    return executor();
  } finally {
    process.chdir(previousCwd);
  }
}

function loadEngine(engineName) {
  const modulePath = ENGINE_MODULES[engineName];
  if (!modulePath) {
    throw new Error(`未知 legacy engine: ${engineName}`);
  }
  return withProjectRoot(() => {
    delete require.cache[require.resolve(modulePath)];
    const loaded = require(modulePath);
    if (!loaded || typeof loaded.cbbjsvmp !== "function") {
      throw new Error(`legacy engine ${engineName} 未导出 cbbjsvmp`);
    }
    return loaded.cbbjsvmp;
  });
}

function compileWithLegacyEngine({ source, sourceFileName, outputFile, profile, seed }) {
  const engine = loadEngine(profile.engine);
  const compileOptions = {
    sourceCode: source,
    sourceFileName,
    seed,
    profileName: profile.name,
  };

  const code = withProjectRoot(() => withPatchedRandom(seed, () => engine(sourceFileName, outputFile, compileOptions)));

  if (outputFile && typeof code === "string" && !fs.existsSync(outputFile)) {
    fs.writeFileSync(outputFile, code);
  }

  return code;
}

module.exports = {
  compileWithLegacyEngine,
};
