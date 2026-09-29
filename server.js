/**
 * AURORIS Full-Stack Server Entry Point
 * Used by npm start ("node server.ts" or "node server.js")
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundlePath = path.resolve(__dirname, 'server.bundle.js');

const isTsx =
  process.execArgv.some((arg) => arg.includes('tsx')) ||
  Boolean(process.env.TSX_VERSION) ||
  process.argv.some((arg) => arg.includes('tsx'));

if (isTsx && process.env.NODE_ENV !== 'production') {
  await import('./src/server/app.ts');
} else if (fs.existsSync(bundlePath)) {
  await import('./server.bundle.js');
} else {
  try {
    const { buildSync } = await import('esbuild');
    buildSync({
      entryPoints: [path.resolve(__dirname, 'src/server/app.ts')],
      bundle: true,
      platform: 'node',
      format: 'esm',
      packages: 'external',
      outfile: bundlePath,
    });
    await import('./server.bundle.js');
  } catch {
    await import('./src/server/app.ts');
  }
}
