declare module 'archiver' {
  import type { Writable } from 'stream';
  interface Archive {
    on(event: 'error', listener: (error: Error) => void): this;
    pipe(destination: Writable): Writable;
    append(data: Buffer, options: { name: string }): this;
    finalize(): Promise<void>;
  }
  export default function archiver(format: 'zip', options?: { zlib?: { level?: number } }): Archive;
}

declare module 'unzipper' {
  interface Entry { path: string; uncompressedSize?: number; buffer(): Promise<Buffer> }
  export const Open: { buffer(data: Buffer): Promise<{ files: Entry[] }> };
}
