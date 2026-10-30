import { extractText, getDocumentProxy } from 'unpdf';
import { DomainError } from './types';
export async function extractPdf(bytes: Uint8Array) {
  const pdf = await getDocumentProxy(bytes);
  try {
    if (pdf.numPages > 10) throw new DomainError('Import no more than 10 PDF pages at a time.');
    // The upstream mergePages option flattens all whitespace, losing invoice field boundaries.
    const pages = await extractText(pdf, { mergePages: false });
    const text = pages.text.join('\n');
    if (text.trim().length < 10)
      throw new DomainError(
        'This PDF has no readable text layer. Upload a PNG/JPEG of the relevant page for OCR, or paste checked text.',
      );
    return {
      text,
      engine: 'unpdf / Mozilla PDF.js',
      warnings: ['PDF reading order may differ from the page. Check totals and line breaks.'],
    };
  } finally {
    await pdf.destroy();
  }
}
