# JSVMP P0 基线计划（兼容优先）

## 目标

先把服务兼容与回归基线固定下来，再进入 secure-lite 改造。

优先级严格固定为：

1. 加密后 JS 能正常运行
2. 结果与原始逻辑一致
3. 旧接口与旧路径兼容
4. 性能劣化可接受
5. 在此前提下再提升防破解成本

## 当前已完成

- Node 服务默认端口统一为 `8080`
- 兼容旧接口：`/js/jsString`、`/js/jsfile`、`/js/number`、`/js/test`
- 兼容旧前缀路径：`/api/*`
- 新增 `ecosystem.config.js` 作为 pm2 运行配置
- README 已补充 8080 / pm2 / 旧接口兼容说明

## P0 交付物

- `tests/jsvmp/compat_fixtures/`：兼容样本集
- `scripts/api-smoke.js`：服务层冒烟脚本
- `docs/jsvmp/compat-checklist.md`：兼容性检查项

## 下一步

- 扩充兼容样本（闭包、异常、原型链、异步）
- 新增行为一致性对比脚本
- 形成 `secure-lite` 方案文档
