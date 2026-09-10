import { HriveHttpClient, idPath, type Query, type RequestOptions } from './core';

export abstract class SdkModule {
  constructor(protected readonly http: HriveHttpClient) {}

  protected request<T>(method: string, path: string, options?: RequestOptions) {
    return this.http.request<T>(method, path, options);
  }

  protected getRequest<T>(path: string, query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.request<T>('GET', path, { ...options, query });
  }

  protected mutation<T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>(method, path, { ...options, body });
  }

  protected id(value: string) {
    return idPath(value);
  }
}
