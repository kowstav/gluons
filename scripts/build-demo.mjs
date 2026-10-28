// Package the real browser acceptance screenshots as a captioned 30-second walkthrough.
// First capture artifacts/demo-frames/01-*.png ... 10-*.png through browser QA.
// Requires FFmpeg on PATH, or GLUONS_FFMPEG pointing to the executable.
import { readdir, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
const folder = path.resolve('artifacts/demo-frames');
const files = (await readdir(folder)).filter((f) => /^\d\d-.*\.png$/.test(f)).sort();
if (files.length !== 10)
  throw new Error('Capture the ten numbered browser walkthrough screenshots first.');
const sequence =
  files.map((f) => `file '${path.join(folder, f).replaceAll('\\', '/')}'\nduration 3`).join('\n') +
  `\nfile '${path.join(folder, files.at(-1)).replaceAll('\\', '/')}'\n`;
await writeFile(path.join(folder, 'sequence.txt'), sequence);
await mkdir('apps/dashboard/public', { recursive: true });
await mkdir('docs/screenshots', { recursive: true });
await copyFile(path.join(folder, files[0]), 'apps/dashboard/public/demo-poster.png');
await copyFile(path.join(folder, files[0]), 'docs/screenshots/dashboard.png');
await copyFile(path.join(folder, files[9]), 'docs/screenshots/landing.png');
const command = process.env.GLUONS_FFMPEG ?? 'ffmpeg';
const proc = spawn(
  command,
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    path.join(folder, 'sequence.txt'),
    '-vf',
    'scale=1440:1000:force_original_aspect_ratio=decrease,pad=1440:1000:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
    '-r',
    '24',
    '-c:v',
    'libvpx',
    '-b:v',
    '1100k',
    '-an',
    '-t',
    '30',
    'apps/dashboard/public/demo.webm',
  ],
  { stdio: 'inherit', windowsHide: true },
);
const code = await new Promise((resolve, reject) => {
  proc.on('error', reject);
  proc.on('exit', resolve);
});
if (code !== 0) throw new Error('FFmpeg could not create the walkthrough.');
console.log(
  'Saved 30-second walkthrough, poster and documentation screenshots. Captions: public/demo.vtt.',
);
