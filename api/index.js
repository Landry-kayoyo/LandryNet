import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res, next) {
  const appUrl = pathToFileURL(resolve(__dirname, '../apps/api/dist/index.mjs')).href;
  const { default: app } = await import(appUrl);
  if (typeof app === 'function') {
    return app(req, res, next);
  }
  return app;
}
