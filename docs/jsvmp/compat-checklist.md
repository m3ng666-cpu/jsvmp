# JSVMP 兼容性检查清单

## 服务接口

- [x] `GET /health`
- [x] `GET /profiles`
- [x] `POST /js/jsString`
- [ ] `POST /js/jsfile`
- [x] `POST /js/number`
- [x] `POST /js/test`
- [x] `POST /api/js/jsString`
- [ ] `POST /api/js/jsfile`
- [x] `POST /api/js/number`
- [x] `POST /api/js/test`

## 运行正确性样本

- [x] 基础函数调用
- [x] 字符串输出
- [ ] 闭包
- [ ] try/catch/finally
- [ ] 原型链 / this
- [ ] 异步回调
- [ ] 动态属性访问

## 部署

- [x] 8080 端口统一
- [x] pm2 配置文件存在
- [ ] pm2 启停命令实机验证
