import { Readable } from 'stream';

/**
 * `MediaService.upload()` takes an `Express.Multer.File` (built by Multer
 * from an HTTP multipart request). `freeze-quote-pdf.handler.ts` and
 * `freeze-invoice-pdf.handler.ts` have a PDF `Buffer` from `DocumentsService`
 * instead — no HTTP upload involved — so this builds the same shape by hand.
 * Only `buffer`, `mimetype`, `size` and `originalname` are ever read by the
 * upload path; the disk-storage fields (`destination`, `filename`, `path`)
 * are meaningless here (memory storage, nothing written to disk).
 */
export function toUploadableFile(
  buffer: Buffer,
  filename: string,
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
    stream: Readable.from(buffer),
    destination: '',
    filename,
    path: '',
  };
}
