import { NextResponse } from 'next/server';
import { DomainError, receiptAmount } from '@gluons/runtime';
import { getContext } from '@/lib/server/store';
import { sameOrigin, apiError, rateLimit } from '@/lib/server/http';
import { extractDocument } from '@/lib/server/documents';
import { structuredInvoice } from '@/lib/server/invoices';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { actor } = await getContext();
    rateLimit(`documents:${actor}`, 4);
    const length = Number(request.headers.get('content-length'));
    if (!length || length > 2_100_000)
      throw new DomainError('Use a document smaller than 2 MB.', 413);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new DomainError('Choose a document.');
    const result = await extractDocument(new Uint8Array(await file.arrayBuffer()), file.type);
    if (result.text.length > 6000)
      throw new DomainError(
        'The extracted text is too long. Import a smaller document or paste a checked excerpt.',
      );
    let invoice: Record<string, unknown> | null = null,
      amount: number | undefined;
    if (form.get('purpose') === 'receipt') {
      try {
        invoice = await structuredInvoice(result.text);
      } catch (error) {
        result.warnings.push((error as Error).message);
      }
      try {
        amount = receiptAmount(result.text);
      } catch (error) {
        result.warnings.push((error as Error).message);
      }
      if (invoice && amount !== undefined) {
        if (invoice.currency === 'USD' && Number(invoice.amount) === amount)
          amount = Number(invoice.amount);
        else {
          amount = undefined;
          result.warnings.push(
            'Template fields and checked total disagree. Enter an amount only after checking the source.',
          );
        }
      }
      if (invoice)
        result.warnings.push(
          'invoice2data matched a template. Compare its fields with the document before approval.',
        );
    }
    return NextResponse.json({ ...result, invoice, amount });
  } catch (error) {
    return apiError(error);
  }
}
