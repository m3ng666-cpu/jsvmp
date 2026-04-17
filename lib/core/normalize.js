const parser = require("@babel/parser");
const generator = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;

const PARSER_PLUGINS = [
  "jsx",
  "classProperties",
  "classPrivateProperties",
  "classPrivateMethods",
  "dynamicImport",
  "optionalChaining",
  "nullishCoalescingOperator",
  "objectRestSpread",
  "topLevelAwait",
  "numericSeparator",
  "logicalAssignment",
  "optionalCatchBinding",
  "asyncGenerators",
  "exportDefaultFrom",
  "exportNamespaceFrom",
];

const HIGH_RISK_NODE_TYPES = new Set([
  "AwaitExpression",
  "ClassDeclaration",
  "ClassExpression",
  "JSXElement",
  "JSXFragment",
  "MetaProperty",
  "PrivateName",
  "StaticBlock",
]);

function parseSource(source) {
  return parser.parse(source, {
    sourceType: "unambiguous",
    allowReturnOutsideFunction: true,
    errorRecovery: false,
    plugins: PARSER_PLUGINS,
  });
}

function normalizeSource(source) {
  const ast = parseSource(source);
  const warnings = [];
  const features = new Set();

  traverse(ast, {
    enter(path) {
      if (HIGH_RISK_NODE_TYPES.has(path.node.type)) {
        features.add(path.node.type);
      }
    },
  });

  if (features.size > 0) {
    warnings.push(`检测到高风险语法节点：${Array.from(features).join(", ")}，历史 VM 编译器可能需要额外降级处理。`);
  }

  const code = generator(ast, {
    comments: false,
    compact: false,
    jsescOption: { minimal: true },
  }).code;

  return {
    ast,
    code,
    warnings,
    features: Array.from(features),
  };
}

module.exports = {
  normalizeSource,
  parseSource,
  PARSER_PLUGINS,
};
