function hashSeed(input) {
  const text = String(input || "jsvmp-default-seed");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let state = hashSeed(seed) || 1;
  return function nextRandom() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let temp = Math.imul(state ^ (state >>> 15), 1 | state);
    temp = (temp + Math.imul(temp ^ (temp >>> 7), 61 | temp)) ^ temp;
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}

function withPatchedRandom(seed, executor) {
  if (!seed) {
    return executor();
  }
  const originalRandom = Math.random;
  Math.random = createSeededRandom(seed);
  try {
    return executor();
  } finally {
    Math.random = originalRandom;
  }
}

module.exports = {
  hashSeed,
  createSeededRandom,
  withPatchedRandom,
};
