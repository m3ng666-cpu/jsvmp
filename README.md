# JSVMP v2

一个围绕 Babel AST 和自定义 VM 运行时构建的 JavaScript 虚拟化混淆项目。这个版本在保留原有 `main.js`、`jiamian.js`、`jiajianbian.js`、`main_pro.js` 四套历史引擎的同时，补上了统一编译内核、profile 配置、seed 随机化、CLI、服务层和兼容性分析入口。

## 这次重构解决了什么

- 把过去“多个脚本各自跑”的模式，整理成统一 `compile()` API
- 给随机化补上 `seed`，支持可复现的构建结果
- 加了 `profile`，把“基础版 / 快速版 / 加固版 / 线程版”变成可选配置，而不是只能手改入口
- 把 HTTP 服务从单文件脚本拆成服务层，保留原有 `/stringUpload`、`/fileUpload` 路径兼容
- 给兼容性补了静态分析和现代语法解析插件，先知道哪里会炸，再决定怎么降级
- 消除了 `require` 历史编译脚本时自动写文件的副作用，方便后续模块化演进

## 当前架构

```text
.
├── cli.js                    # JSVMP CLI
├── lib/
│   ├── index.js              # 统一编译入口
│   ├── core/
│   │   ├── files.js          # 目录扫描与输出路径工具
│   │   ├── normalize.js      # 语法解析、兼容性预检
│   │   ├── profiles.js       # profile 定义
│   │   ├── random.js         # seed 随机数和随机补丁
│   │   └── report.js         # 编译报告与指标
│   ├── engines/
│   │   └── legacy.js         # 旧引擎适配层
│   ├── pipeline/
│   │   └── batch.js          # 目录构建与配置驱动构建
│   └── service/
│       └── http-server.js    # HTTP 服务
├── src/                      # 输入源码示例
├── dist/                     # 中间产物 / 生成配置
├── outsrc/                   # 输出结果目录
├── tool/                     # 历史转换工具
├── jiaquban/                 # 加密版依赖数据和模板
├── main.js                   # 历史基础引擎
├── jiamian.js                # 历史加固引擎
├── jiajianbian.js            # 历史快速引擎
├── main_pro.js               # 历史线程版引擎
└── start.js                  # 服务入口
```

## profile 说明

| Profile | Legacy Engine | 用途 |
|---|---|---|
| `basic` | `main.js` | 最接近原始调试版 |
| `fast` | `jiajianbian.js` | 快速构建、随机化轻量 |
| `balanced` | `jiamian.js` | 默认推荐，兼顾可用性和强度 |
| `hardened` | `jiamian.js` | 更强调随机化和包装 |
| `threaded` | `main_pro.js` | 使用线程思路的高强度版本 |

## 安装

```bash
npm install
```

## CLI

### 1. 构建文件

```bash
node cli.js build ./src/test.js -o ./outsrc/v2-fast.js --profile fast --seed demo-seed
```

### 2. 分析兼容性

```bash
node cli.js analyze ./src/test.js
```

### 3. 批量编译整个目录

```bash
node cli.js build-dir ./src --out-dir ./outsrc/batch --profile fast --seed batch-seed
```

### 4. 按配置文件批量构建

```bash
node cli.js build-config ./jsvmp.config.json
```

### 5. 查看 profile 列表

```bash
node cli.js profiles
```

### 6. 启动服务

```bash
node start.js
```

## HTTP API

默认监听 `8080` 端口。

兼容旧 Java 版接口：`POST /js/jsString`、`POST /js/jsfile`、`POST /js/number`、`POST /js/test`，返回 `Message { code, message, state }` 结构。

### 健康检查

- `GET /health`

### profile 列表

- `GET /profiles`

### 旧 Java API 兼容接口

以下接口用于兼容旧 Java 版调用方式：

- `POST /js/jsString`
  - `application/x-www-form-urlencoded`
  - 参数：`textString`（兼容接收 `jsString`）、`profile`、`seed`
  - 返回：`Message { code, message, state }`，其中 `message` 为编译后的 JS 文本，前缀会补 `var jsvmp = 'jsvmp.com';`

- `POST /js/jsfile`
  - `multipart/form-data`
  - 文件字段：任意第一个文件字段即可
  - 可选字段：`profile`、`seed`
  - 返回：`Message { code, message, state }`

- `POST /js/number`
  - 返回当前服务启动后的编译计数，格式同 `Message { code, message, state }`

- `POST /js/test`
  - 保留旧探活返回结构

### v2 服务接口

- `POST /stringUpload`
  - `application/x-www-form-urlencoded`
  - 参数：`jsString`、`profile`、`seed`
  - 返回：JSON 编译报告

- `POST /compile`

- `POST /compile`
- `application/json`

请求示例：

```json
{
  "source": "function add(a,b){ return a+b }",
  "profile": "balanced",
  "seed": "release-2026-04-17"
}
```

## 兼容性说明

`lib/core/normalize.js` 目前先做两件事：

- 允许现代 JS 语法被正常 parse
- 对明显高风险语法做静态预警

这意味着 v2 已经比旧版本更适合做大规模改造，但还没有承诺“所有 ES202x 语法都可被历史 VM 编译器完整支持”。这一层是后续继续替换 legacy compiler 的基础。

## 旧引擎状态

历史引擎仍然保留：

- `main.js`
- `jiamian.js`
- `jiajianbian.js`
- `main_pro.js`

但它们已经被改成可以被模块化调用，不再在 `require` 时直接执行样例任务。这样后续可以分阶段把 opcode 编译器、IR、runtime emitter 逐步迁到 `lib/` 内。

## 配置驱动构建

仓库根目录新增了 `jsvmp.config.json`，用于描述单文件目标和目录目标。每次执行 `build-config` 后，都会在 `outsrc/manifests/` 下写出一份构建清单，方便你后面每个版本直接归档、核对和推 GitHub。

## 部署

生产默认使用 `8080` 端口，并提供 `pm2` 配置文件 `ecosystem.config.js`。当前线上切换方式为：停掉旧 `jsvmp.jar`，保持原端口 `8080` 不变，由 Node 版 `start.js` 接管，并继续兼容旧 `/js/*` API。

```bash
npm run serve:prod
# 或
npx pm2 start ecosystem.config.js --update-env
npx pm2 save
```

如果系统没有全局安装 `pm2`，直接使用 `npx pm2` 即可。

## 后续演进方向

- 用统一 IR 替换四套重复的 `startgetType`
- 把 opcode schema 抽出来，支持动态 handler 组合
- 补全现代语法 normalize
- 增加回归测试、运行时对照测试、benchmark
- 做 runtime profile 生成器，而不是继续维护多套脚本

## 作者

- 作者：陈不不
- 重构整理：JSVMP v2 架构升级
