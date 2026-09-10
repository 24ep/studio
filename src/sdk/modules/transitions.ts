import type { Query, RequestOptions } from '../core';
import { SdkModule } from '../module-base';
import type { Page, SdkRecord } from '../types';

export class TransitionsModule extends SdkModule {
  list<T = Page<SdkRecord>>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>('/api/v1/transitions', query, options);
  }

  create<T = SdkRecord>(input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', '/api/v1/transitions', input, options);
  }
}
