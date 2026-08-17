# Frontend SDK

`src/sdk/generated` 由 OpenAPI 文档生成，不建议手工修改。

当前边界（2026-08-14）：生成目录落后于后端实现，尚未包含 reader、feature toggles、notifications、development history、forgot password 等接口。业务运行仍以 `src/api/*.ts` 手写封装为主；在重新生成前，不要把本目录当作完整后端契约。

生成方式：

```bash
npm run gen:sdk
```

如需指定文档地址：

```bash
OPENAPI_INPUT=http://localhost:10404/api/v3/api-docs npm run gen:sdk
```

## 重新生成流程

1. 使用当前分支和 JDK 17 启动 `Chen404Bac`，确认 `/api/v3/api-docs` 可访问。
2. 在前端目录执行 `npm run gen:sdk`；生成文件只由脚本覆盖，不手工修补。
3. 审查删除、重命名和响应类型变化，确认手写 `src/api/*.ts` 没有与新契约冲突。
4. 至少执行 `npm run build` 与 `npm run check:element-boundary`。

生成命令不会自动证明业务接口已经迁移到 SDK，也不会运行前端测试。当前 `package.json` 仍缺少统一测试脚本，测试状态见仓库级扫描报告。
