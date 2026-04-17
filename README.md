# JSVMP

一个基于 Babel AST 的 JavaScript 虚拟化混淆实验项目，用于将输入的 JS 代码转换为自定义 VM 指令执行形式，并提供多个版本的生成入口。

## 项目说明

这个仓库包含几种不同形态的 JSVMP 方案：

- `main.js`，基础调试版
- `jiamian.js`，加密版，包含更激进的指令打乱
- `jiajianbian.js`，快速加密版
- `main_pro.js`，增强版，包含线程相关处理逻辑
- `start.js`，HTTP 服务入口，支持上传字符串或文件后执行转换

## 目录结构

```text
.
├── src/                  # 输入源码示例
├── dist/                 # 中间产物 / 生成配置
├── outsrc/               # 输出结果目录
├── tool/                 # 核心转换工具和辅助脚本
├── jiaquban/             # 加密版依赖数据和模板
├── main.js               # 基础版入口
├── main_pro.js           # 增强版入口
├── jiamian.js            # 加密版入口
├── jiajianbian.js        # 快速加密版入口
├── start.js              # HTTP 服务入口
└── README.md
```

## 环境要求

- Node.js 16+
- npm

当前项目依赖包括：

- `@babel/parser`
- `@babel/generator`
- `@babel/traverse`
- `babel-cli`
- `multiparty`
- `formidable`
- `busboy`

## 安装依赖

```bash
npm install
```

如果你需要兼容某些旧流程，也可以单独安装文档里提到的工具：

```bash
npm install @babel/parser
npm install -g traceur
```

## 使用前说明

部分输入代码需要先转换为 ES5，再进入 JSVMP 流程。

参考教程：

- https://blog.csdn.net/qq_46013295/article/details/128481895

## 主要入口

### 1. 基础版

`main.js` 是正常调试版，适合查看核心 VM 转换逻辑。

### 2. 加密版

`jiamian.js` 是加密版，会重新打乱指令集。

### 3. 快速加密版

`jiajianbian.js` 是快速版，适合直接对输入源码做快速转换。

### 4. 增强版

`main_pro.js` 是升级版，加入了线程相关思路，用于提高还原难度。

## HTTP 服务

项目自带一个简单服务入口 `start.js`，默认监听 `3000` 端口。

启动：

```bash
node start.js
```

### 接口 1，上传字符串

- 路径：`/stringUpload`
- 方法：`POST`
- 参数：`jsString`

### 接口 2，上传文件

- 路径：`/fileUpload`
- 方法：`POST`
- 表单文件上传

服务会调用 `jiajianbian.js` 中导出的 `cbbjsvmp` 方法，把输入内容转换后写入 `outsrc/` 下的目标文件。

## 输出说明

常见输出目录：

- `outsrc/`，转换后的输出文件
- `dist/jiamain.json`，部分运行时或混淆映射数据

## 压缩示例

```bash
uglifyjs out.js --mangle --output out2.js
uglifyjs out.js --compress --mangle --output out3.js
```

## 示例说明

README 原始示例中包含了带 `cbb_` 前缀的特殊函数调用方式，这类函数走的是另一套 VM 路径，比普通函数更复杂，也可配合线程逻辑使用。

## 注意事项

- 这是偏实验性质的 JS 虚拟化/混淆项目
- 输入代码越现代，越建议先做 ES5 降级
- `node_modules/`、运行日志和中间输出不建议直接提交到仓库

## 作者

- 作者：陈不不
- 邮箱：2833844911@qq.com
