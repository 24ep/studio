import { createRequire } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';
import mammoth from 'mammoth';

const requireFromHere = createRequire(import.meta.url);
const { PDFParse } = requireFromHere('pdf-parse') as typeof import('pdf-parse');
PDFParse.setWorker(pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href);

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const supportedExtensions = new Set(['pdf', 'docx', 'txt', 'md']);

export async function extractLearningDocument(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!supportedExtensions.has(extension)) {
    throw new Error(`${file.name} is not supported. Upload PDF, DOCX, TXT, or Markdown files.`);
  }
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);

  const buffer = Buffer.from(await file.arrayBuffer());
  let value = '';
  if (extension === 'docx') {
    value = (await mammoth.extractRawText({ buffer })).value;
  } else if (extension === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    value = (await parser.getText().finally(() => parser.destroy())).text;
  } else {
    value = buffer.toString('utf8');
  }

  const text = value.replace(/\0/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!text) throw new Error(`No readable text was found in ${file.name}. Scanned PDFs need OCR before upload.`);
  return { name: file.name, text };
}

export const learningDocumentAccept = '.pdf,.docx,.txt,.md';
