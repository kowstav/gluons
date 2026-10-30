import { spawn } from 'node:child_process';
import path from 'node:path';
import { DomainError } from '@gluons/runtime';
export async function structuredInvoice(text: string): Promise<Record<string, unknown> | null> {
  const python = process.env.GLUONS_INVOICE_PYTHON;
  if (!python) return null;
  const runner =
    process.env.GLUONS_INVOICE_RUNNER ??
    path.resolve(process.cwd(), '../../packages/automation-bridge/invoice.py');
  return new Promise((resolve, reject) => {
    const child = spawn(python, [runner], {
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let output = '',
      error = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new DomainError('Invoice template extraction timed out.', 503));
    }, 8000);
    child.stdout.on('data', (chunk) => {
      output += chunk;
      if (output.length > 16000) child.kill();
    });
    child.stderr.on('data', (chunk) => {
      error = (error + chunk).slice(-2000);
    });
    child.on('error', () => {
      clearTimeout(timer);
      reject(
        new DomainError('Invoice worker could not start. Check its Python configuration.', 503),
      );
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code)
        return reject(
          new DomainError(
            'Invoice template did not match. Check the document and use the editable text and amount fields.',
            422,
          ),
        );
      try {
        resolve(JSON.parse(output));
      } catch {
        reject(new DomainError('Invoice worker returned invalid output.', 503));
      }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify({ text }));
  });
}
