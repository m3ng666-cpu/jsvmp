const fs = require("fs");
const http = require("http");
const path = require("path");
const multiparty = require("multiparty");
const { compile, buildCompileReport } = require("../index");

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const outputDir = path.resolve(__dirname, "../../outsrc");

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

function ensureOutputPath(profileName) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return path.join(outputDir, `service-${profileName}-${Date.now()}.js`);
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

  const outputFile = ensureOutputPath(payload.profile || "balanced");
  const result = compile(payload.source, {
    profile: payload.profile,
    seed: payload.seed,
    outputFile,
    sourceFileName: payload.sourceFileName || "request-input.js",
  });

  return sendJson(response, 200, buildCompileReport(result));
}

function handleFileUpload(request, response) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    let fileBuffer = null;
    const fields = {};

    form.on("field", (name, value) => {
      fields[name] = value;
    });

    form.on("part", part => {
      if (!part.filename) {
        part.resume();
        return;
      }
      const chunks = [];
      part.on("data", chunk => chunks.push(chunk));
      part.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    form.on("close", () => {
      try {
        const source = fileBuffer ? fileBuffer.toString("utf8") : "";
        if (!source.trim()) {
          sendJson(response, 400, { error: "上传文件为空" });
          return resolve();
        }
        const outputFile = ensureOutputPath(fields.profile || "balanced");
        const result = compile(source, {
          profile: fields.profile,
          seed: fields.seed,
          outputFile,
          sourceFileName: fields.sourceFileName || "upload-input.js",
        });
        sendJson(response, 200, buildCompileReport(result));
        return resolve();
      } catch (error) {
        return reject(error);
      }
    });

    form.parse(request);
  });
}

function startServer(options) {
  const port = (options && options.port) || DEFAULT_PORT;
  const server = http.createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        return sendJson(response, 200, { ok: true, service: "jsvmp" });
      }
      if (request.method === "POST" && request.url === "/stringUpload") {
        return await handleStringUpload(request, response);
      }
      if (request.method === "POST" && request.url === "/fileUpload") {
        return await handleFileUpload(request, response);
      }
      if (request.method === "POST" && request.url === "/compile") {
        return await handleCompile(request, response);
      }

      return sendJson(response, 404, { error: "未找到接口" });
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
