/**
 * AURORIS Full-Stack Server Entry Point
 * Used by npm start ("node server.ts") and npm run dev ("tsx server.ts")
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
  // In development with tsx, run through src/server/app.ts with Vite middleware mounted
  await import('./src/server/app.ts');
} else if (fs.existsSync(bundlePath)) {
  // In production or when run via node, use the compiled bundle
  await import('./server.bundle.js');
} else {
  // If server.bundle.js does not exist, bundle src/server/app.ts on the fly using esbuild
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
