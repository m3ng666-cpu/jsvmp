function summarizeCode(code) {
  const text = String(code || "");
  return {
    outputLength: text.length,
    lineCount: text ? text.split(/\r?\n/).length : 0,
  };
}

function buildCompileReport(result) {
  return {
    ok: result.ok,
    profile: result.profile,
    engine: result.engine,
    seed: result.seed,
    inputFile: result.inputFile,
    outputFile: result.outputFile,
    warnings: result.warnings,
    features: result.features,
    metrics: summarizeCode(result.code),
  };
}

module.exports = {
  summarizeCode,
  buildCompileReport,
};
