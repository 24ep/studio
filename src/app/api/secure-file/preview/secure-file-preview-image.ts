import { NextResponse, type NextRequest } from 'next/server';
import sharp from 'sharp';
import { MINIO_BUCKET, minioClient } from '@/lib/minio';
import {
  getPreviewFileName,
  getPreviewHeaders,
} from './secure-file-preview-headers';
import type { SecureFilePreviewRequest } from './secure-file-preview-request';

type ResizeInput = Pick<SecureFilePreviewRequest, 'filePath' | 'fileName' | 'thumbnail' | 'width' | 'height'>;

export async function buildResizedPreviewImageResponse(request: NextRequest, input: ResizeInput) {
  const stream = await minioClient.getObject(MINIO_BUCKET, input.filePath);
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  const imageBuffer = Buffer.concat(chunks);
  const resizeWidth = input.thumbnail ? 200 : input.width;
  const resizeHeight = input.thumbnail ? 200 : input.height;

  let sharpInstance = sharp(imageBuffer);
  if (resizeWidth && resizeHeight) {
    sharpInstance = sharpInstance.resize(resizeWidth, resizeHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  } else if (resizeWidth) {
    sharpInstance = sharpInstance.resize(resizeWidth, null, {
      withoutEnlargement: true,
    });
  } else if (resizeHeight) {
    sharpInstance = sharpInstance.resize(null, resizeHeight, {
      withoutEnlargement: true,
    });
  }

  const outputFormat = input.filePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
  const quality = input.thumbnail ? 60 : 85;
  const resizedBuffer = outputFormat === 'jpeg'
    ? await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer()
    : await sharpInstance.png({ quality }).toBuffer();
  const headers = await getPreviewHeaders(
    outputFormat === 'png' ? 'image/png' : 'image/jpeg',
    getPreviewFileName(input.fileName, input.filePath),
    request
  );
  headers.set('Content-Length', String(resizedBuffer.length));
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new NextResponse(new Uint8Array(resizedBuffer), { status: 200, headers });
}

export async function buildTransparentMissingImageResponse(
  request: NextRequest,
  fileName: string | undefined,
  objectName: string
) {
  const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const headers = await getPreviewHeaders(
    'image/png',
    getPreviewFileName(fileName, objectName),
    request
  );
  headers.set('Content-Length', String(transparentPng.length));
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('X-File-Status', 'not-found');

  return new NextResponse(transparentPng, { status: 200, headers });
}
