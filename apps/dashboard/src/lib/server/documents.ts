import { createRequire } from 'node:module';
import { imageSize } from 'image-size';
import { DomainError, extractPdf } from '@gluons/runtime';
const require = createRequire(import.meta.url);
export async function extractDocument(bytes: Uint8Array, type: string) {
  if (!bytes.length || bytes.length > 2_000_000)
    throw new DomainError('Use a document smaller than 2 MB.', 413);
  if (type === 'text/plain' || type === 'text/csv') {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { text, engine: 'UTF-8 text', warnings: [] as string[] };
  }
  if (type === 'application/pdf' && new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-') {
    return extractPdf(bytes);
  }
  if (['image/png', 'image/jpeg'].includes(type)) {
    if (process.env.GLUONS_OCR_ENABLED !== 'true')
      throw new DomainError(
        'Image OCR is disabled on this host. Enable GLUONS_OCR_ENABLED on a worker-capable Node host, or paste checked text.',
        503,
      );
    const dimensions = imageSize(bytes);
    if (
      !dimensions.width ||
      !dimensions.height ||
      dimensions.width * dimensions.height > 12_000_000
    )
      throw new DomainError('Use an image with at most 12 million pixels.', 413);
    const { createWorker } = await import('tesseract.js');
    const english = require('@tesseract.js-data/eng') as { langPath: string };
    const worker = await createWorker('eng', 1, {
      langPath: english.langPath,
      cacheMethod: 'none',
      gzip: true,
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        worker.recognize(Buffer.from(bytes)),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new DomainError('OCR timed out. Use a clearer, smaller image.')),
            25_000,
          );
        }),
      ]);
      return {
        text: result.data.text,
        engine: 'Tesseract.js / bundled English trained data',
        warnings: [
          `OCR confidence ${Math.round(result.data.confidence)}%. Check every number and date; confidence is not field accuracy.`,
        ],
      };
    } finally {
      if (timer) clearTimeout(timer);
      await worker.terminate();
    }
  }
  throw new DomainError('Use a text PDF, PNG, JPEG, UTF-8 TXT or CSV.');
}
