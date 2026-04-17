const DEFAULT_PROFILE = "balanced";

const PROFILE_DEFINITIONS = {
  basic: {
    name: "basic",
    engine: "basic",
    description: "历史基础版，便于调试和理解 VM 输出。",
    compatibility: "legacy",
    randomization: "minimal",
  },
  fast: {
    name: "fast",
    engine: "fast",
    description: "快速构建版，适合在线服务和轻量随机化。",
    compatibility: "wide-parse",
    randomization: "seeded",
  },
  balanced: {
    name: "balanced",
    engine: "hardened",
    description: "默认模式，兼顾可用性、随机性和产物强度。",
    compatibility: "wide-parse",
    randomization: "seeded",
  },
  hardened: {
    name: "hardened",
    engine: "hardened",
    description: "偏防护的构建模式，优先启用加固引擎。",
    compatibility: "wide-parse",
    randomization: "seeded",
  },
  threaded: {
    name: "threaded",
    engine: "threaded",
    description: "使用线程相关 runtime 的高强度模式。",
    compatibility: "legacy",
    randomization: "seeded",
  },
};

function resolveProfile(name, overrides) {
  const profileName = name && PROFILE_DEFINITIONS[name] ? name : DEFAULT_PROFILE;
  return {
    ...PROFILE_DEFINITIONS[profileName],
    ...(overrides || {}),
  };
}

module.exports = {
  DEFAULT_PROFILE,
  PROFILE_DEFINITIONS,
  resolveProfile,
};
