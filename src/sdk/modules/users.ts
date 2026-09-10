import type { Query, RequestOptions } from '../core';
import { SdkModule } from '../module-base';
import type { ApiEnvelope, SdkRecord, User, UserListData } from '../types';

export class UsersModule extends SdkModule {
  private path(id?: string) {
    return id ? `/api/v1/users/${this.id(id)}` : '/api/v1/users';
  }

  list<T = ApiEnvelope<UserListData>>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>(this.path(), query, options);
  }

  create<T = User>(input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', this.path(), input, options);
  }

  getById<T = User>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', this.path(id), options);
  }

  update<T = User>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', this.path(id), input, options);
  }

  delete<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('DELETE', this.path(id), options);
  }

  syncActiveDirectory<T = SdkRecord>(input?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path()}/sync-ad`, input, options);
  }
}
