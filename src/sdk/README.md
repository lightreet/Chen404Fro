# Frontend SDK

`src/sdk/generated` 由 OpenAPI 文档生成，不建议手工修改。

生成方式：

```bash
npm run gen:sdk
```

如需指定文档地址：

```bash
OPENAPI_INPUT=http://localhost:10404/api/v3/api-docs npm run gen:sdk
```
