const fs = require("fs");
const http = require("http");
const path = require("path");
const multiparty = require("multiparty");
const { compile, buildCompileReport, PROFILE_DEFINITIONS, DEFAULT_PROFILE } = require("../index");

const DEFAULT_PORT = Number(process.env.PORT || 8080);
const outputDir = path.resolve(__dirname, "../../outsrc");
const COUNTER_FILE = path.resolve(__dirname, "../../outsrc/.amount-counter.json");

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload, null, 2));
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";
    request.on("data", chunk => {
      rawBody += chunk;
    });
    request.on("end", () => resolve(rawBody));
    request.on("error", reject);
  });
}

function ensureOutputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

function ensureOutputPath(profileName) {
  ensureOutputDir();
  return path.join(outputDir, `service-${profileName}-${Date.now()}.js`);
}

function buildMessage(code, message, state) {
  return { code, message, state };
}

function readCounter() {
  ensureOutputDir();
  if (!fs.existsSync(COUNTER_FILE)) {
    return 0;
  }
  try {
    const payload = JSON.parse(fs.readFileSync(COUNTER_FILE, "utf8"));
    return Number(payload.amount || 0);
  } catch (error) {
    return 0;
  }
}

function writeCounter(amount) {
  ensureOutputDir();
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ amount }, null, 2));
}

function increaseCounter() {
  const next = readCounter() + 1;
  writeCounter(next);
  return next;
}

function wrapLegacyStringResult(code) {
  return `var jsvmp = 'jsvmp.com';\n${code}`;
}

function getLegacySourceFromParams(params) {
  return params.get("textString") || params.get("jsString") || "";
}

function compileLegacyString(source, profile, seed) {
  const outputFile = ensureOutputPath(profile || "fast");
  const result = compile(source, {
    profile,
    seed,
    outputFile,
    sourceFileName: "inline-input.js",
  });
  increaseCounter();
  return buildMessage(200, wrapLegacyStringResult(result.code), "成功");
}

async function handleLegacyJsString(request, response) {
  const rawBody = await collectRequestBody(request);
  const params = new URLSearchParams(rawBody);
  const source = getLegacySourceFromParams(params);
  if (!source.trim()) {
    return sendJson(response, 200, buildMessage(400, "请输入文本", "错误"));
  }
  if (source.length > 1024 * 1024) {
    return sendJson(response, 200, buildMessage(400, "文本不能超过1MB", "错误"));
  }

  const profile = params.get("profile") || "fast";
  const seed = params.get("seed") || undefined;
  return sendJson(response, 200, compileLegacyString(source, profile, seed));
}

function handleLegacyJsFile(request, response) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    let fileBuffer = null;
    let fileName = "";
    const fields = {};

    form.on("field", (name, value) => {
      fields[name] = value;
    });

    form.on("part", part => {
      if (!part.filename) {
        part.resume();
        return;
      }
      fileName = part.filename || "";
      const chunks = [];
      part.on("data", chunk => chunks.push(chunk));
      part.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    form.on("close", () => {
      try {
        if (!fileBuffer || fileBuffer.length === 0) {
          sendJson(response, 200, buildMessage(400, "请上传文件", "错误"));
          return resolve();
        }
        if (fileName && !fileName.toLowerCase().endsWith(".js")) {
          sendJson(response, 200, buildMessage(400, "请上传正确的文件", "错误"));
          return resolve();
        }
        const source = fileBuffer.toString("utf8");
        const profile = fields.profile || "fast";
        const seed = fields.seed || undefined;
        sendJson(response, 200, compileLegacyString(source, profile, seed));
        return resolve();
      } catch (error) {
        return reject(error);
      }
    });

    form.parse(request);
  });
}

function handleLegacyNumber(response) {
  return sendJson(response, 200, buildMessage(200, String(readCounter()), "成功"));
}

async function handleStringUpload(request, response) {
  const rawBody = await collectRequestBody(request);
  const params = new URLSearchParams(rawBody);
  const source = params.get("jsString") || "";
  if (!source.trim()) {
    return sendJson(response, 400, { error: "缺少 jsString" });
  }

  const profile = params.get("profile") || undefined;
  const seed = params.get("seed") || undefined;
  const outputFile = ensureOutputPath(profile || "fast");
  const result = compile(source, { profile, seed, outputFile, sourceFileName: "inline-input.js" });
  return sendJson(response, 200, buildCompileReport(result));
}

async function handleCompile(request, response) {
  const rawBody = await collectRequestBody(request);
  const payload = JSON.parse(rawBody || "{}");
  if (!payload.source) {
    return sendJson(response, 400, { error: "缺少 source" });
  }

  const outputFile = ensureOutputPath(payload.profile || DEFAULT_PROFILE);
  const result = compile(payload.source, {
    profile: payload.profile,
    seed: payload.seed,
    outputFile,
    sourceFileName: payload.sourceFileName || "request-input.js",
  });

  return sendJson(response, 200, buildCompileReport(result));
}

function normalizeRequestPath(url) {
  const requestPath = (url || "").split("?")[0] || "/";
  if (requestPath.startsWith("/api/")) {
    return requestPath.slice(4) || "/";
  }
  return requestPath;
}

function startServer(options) {
  const port = (options && options.port) || DEFAULT_PORT;
  const server = http.createServer(async (request, response) => {
    try {
      const requestPath = normalizeRequestPath(request.url);
      if (request.method === "GET" && requestPath === "/health") {
        return sendJson(response, 200, { ok: true, service: "jsvmp", port });
      }
      if (request.method === "GET" && requestPath === "/profiles") {
        return sendJson(response, 200, {
          ok: true,
          defaultProfile: DEFAULT_PROFILE,
          profiles: PROFILE_DEFINITIONS,
        });
      }
      if (request.method === "POST" && requestPath === "/js/jsString") {
        return await handleLegacyJsString(request, response);
      }
      if (request.method === "POST" && requestPath === "/js/jsfile") {
        return await handleLegacyJsFile(request, response);
      }
      if (request.method === "POST" && requestPath === "/js/test") {
        return sendJson(response, 200, buildMessage(200, "chengg", "dfdsf"));
      }
      if (request.method === "POST" && requestPath === "/js/number") {
        return handleLegacyNumber(response);
      }
      if (request.method === "POST" && requestPath === "/stringUpload") {
        return await handleStringUpload(request, response);
      }
      if (request.method === "POST" && requestPath === "/compile") {
        return await handleCompile(request, response);
      }

      return sendJson(response, 404, { error: "未找到接口", path: requestPath });
    } catch (error) {
      return sendJson(response, 500, {
        error: error.message,
        stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
      });
    }
  });

  server.listen(port, () => {
    console.log(`[jsvmp] service listening on :${port}`);
  });

  server.on("error", error => {
    console.error("[jsvmp] service error:", error);
  });

  return server;
}

module.exports = {
  startServer,
};
