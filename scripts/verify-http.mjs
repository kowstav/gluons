import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const root = process.cwd();
const port = process.env.GLUONS_TEST_PORT ?? '3100';
const folder = path.join(root, 'artifacts', `http-${Date.now()}`);
await mkdir(folder, { recursive: true });
const env = {
  ...process.env,
  GLUONS_ALLOW_LOCAL_DEMO: 'true',
  GLUONS_AI_MODE: 'demo',
  GLUONS_OCR_ENABLED: 'true',
  GLUONS_DATA_PATH: path.join(folder, 'workspace.json'),
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}`,
};
const server = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', port],
  { cwd: path.join(root, 'apps/dashboard'), env, stdio: 'inherit', windowsHide: true },
);
let failed = false;
try {
  let ready = false;
  let lastError = '';
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch(`${env.PLAYWRIGHT_BASE_URL}/api/workspace`);
      if (response.ok) {
        ready = true;
        break;
      }
      lastError = `${response.status}: ${(await response.text()).slice(0, 400)}`;
    } catch (error) {
      lastError = `${error.message}: ${error.cause?.code ?? ''}`;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!ready) throw new Error(`Production server did not become ready. ${lastError}`);
  const child = spawn(process.execPath, [require.resolve('@playwright/test/cli'), 'test'], {
    cwd: root,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', resolve);
  });
  if (code !== 0) failed = true;
} catch (error) {
  console.error(error.message);
  failed = true;
} finally {
  server.kill();
}
if (failed) process.exitCode = 1;
