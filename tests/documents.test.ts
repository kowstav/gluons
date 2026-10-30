import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { jsPDF } from 'jspdf';
import { extractDocument } from '../apps/dashboard/src/lib/server/documents';
import { receiptAmount } from '../packages/runtime/src/automation';
test('real PDF.js extraction reads a generated PDF and rejects empty scans', async () => {
  const pdf = new jsPDF();
  pdf.text('Invoice: GL-100\nDate: 2026-10-30\nTotal: USD 48.50', 20, 30);
  const result = await extractDocument(
    new Uint8Array(pdf.output('arraybuffer')),
    'application/pdf',
  );
  assert.match(result.text, /48.50/);
  assert.equal(receiptAmount(result.text), 48.5);
  assert.match(result.engine, /PDF.js/);
  const blank = new jsPDF();
  await assert.rejects(
    extractDocument(new Uint8Array(blank.output('arraybuffer')), 'application/pdf'),
    /text layer/,
  );
  await assert.rejects(extractDocument(new Uint8Array(2_000_001), 'text/plain'), /2 MB/);
});
test('real Tesseract OCR runs against bundled English data without a remote model service', async () => {
  const previous = process.env.GLUONS_OCR_ENABLED;
  process.env.GLUONS_OCR_ENABLED = 'true';
  try {
    const result = await extractDocument(await readFile('tests/fixtures/invoice.png'), 'image/png');
    assert.match(result.text, /48[.,]50/);
    assert.match(result.engine, /Tesseract/);
  } finally {
    if (previous === undefined) delete process.env.GLUONS_OCR_ENABLED;
    else process.env.GLUONS_OCR_ENABLED = previous;
  }
});
