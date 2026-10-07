import { Injectable } from '@nestjs/common';
import pdfMake from 'pdfmake';

/**
 * `pdfmake`'s CJS entry is `module.exports = new pdfmake()` — a single class
 * INSTANCE, not a plain object of standalone functions
 * (`node_modules/pdfmake/js/index.js`: `createPdf`/`setFonts`/... are all
 * methods reading/writing `this.fonts` etc., defined on the prototype).
 * Confirmed live by trial: a named import (`import { createPdf, setFonts }
 * from 'pdfmake'`) compiles to a detached call that loses `this` ("Cannot
 * set properties of undefined (setting 'fonts')"); a namespace import
 * (`import * as pdfMake`) builds a synthetic object from the instance's OWN
 * enumerable properties only, which drops prototype methods entirely
 * (`pdfMake.setFonts is not a function`). The default import below is the
 * one shape (`esModuleInterop`'s synthetic default = the raw `module.exports`
 * instance, prototype chain intact) where `pdfMake.setFonts(...)`/
 * `pdfMake.createPdf(...)` are real method calls on that instance.
 *
 * `@types/pdfmake`'s `index.d.ts` only re-exports a handful of content types
 * (`Content`, `Table`, `TableCell`, ...) — `TDocumentDefinitions` itself,
 * `createPdf`'s own parameter type, is declared in `./interfaces` but never
 * re-exported. `Parameters<typeof pdfMake.createPdf>[0]` recovers it without
 * reaching into the untyped subpath.
 */
export type PdfDocDefinition = Parameters<typeof pdfMake.createPdf>[0];

/**
 * pdfmake 0.3.11 is built directly on `pdfkit` (CHANGELOG, "Reverted to the
 * original pdfkit package") and needs no embedded font files to use PDFKit's
 * 14 standard fonts — `standard-fonts/Helvetica.js` in the installed package
 * is exactly this table (font family name -> the 4 PDFKit base-14 names).
 * Declared here rather than imported from that path because `@types/pdfmake`
 * has no typing for the `pdfmake/standard-fonts/*` subpath.
 */
const STANDARD_FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

/**
 * The thin pdfmake wrapper (doc/notes/Phaces/15-documents.md). Registers the
 * one font family the layouts use and turns a `TDocumentDefinitions` into a
 * `Buffer` — nothing else. `quote.renderer.ts`/`invoice.renderer.ts` build
 * the document definition; this class never looks at a quote or an invoice.
 */
@Injectable()
export class PdfService {
  constructor() {
    pdfMake.setFonts(STANDARD_FONTS);
    // Tried denying both access policies outright (this app never puts a
    // raw remote/local URL into `content.image` — the logo is always
    // pre-fetched into a data URI by `fetchLogoDataUri` first) to silence
    // pdfmake's "no access policy defined" warning. Reverted: confirmed live
    // that `setLocalAccessPolicy` also gates PDFKit's OWN standard-14-font
    // resolution (`PDFDocument.provideFont` -> `validateLocalFile`), so
    // denying it throws "Access to local file denied" for `Helvetica-Bold`
    // and breaks every render. Left unset — the two startup warnings are
    // harmless noise for this app's actual usage (no remote/local URL ever
    // reaches `content.image`).
  }

  async render(docDefinition: PdfDocDefinition): Promise<Buffer> {
    const pdf = pdfMake.createPdf(docDefinition);
    return pdf.getBuffer();
  }
}
