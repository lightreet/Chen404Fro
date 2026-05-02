import { rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from 'openapi-typescript-codegen';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const output = resolve(projectRoot, 'src/sdk/generated');
const input = process.env.OPENAPI_INPUT || 'http://localhost:10404/api/v3/api-docs';

async function main() {
  await rm(output, { recursive: true, force: true });

  await generate({
    input,
    output,
    httpClient: 'axios',
    useOptions: true,
    useUnionTypes: true,
    exportSchemas: false,
  });

  console.log(`[openapi-sdk] generated from ${input}`);
}

main().catch((error) => {
  console.error('[openapi-sdk] generate failed', error);
  process.exitCode = 1;
});
