import type { RequestOptions } from '../core';
import { SdkModule } from '../module-base';
import type { LoginInput, LoginResponse } from '../types';

export class AuthModule extends SdkModule {
  async login<T extends LoginResponse = LoginResponse>(input: LoginInput, options?: Omit<RequestOptions, 'body'>) {
    const response = await this.mutation<T>('POST', '/api/v1/auth/login', input, options);
    const token = response.token || response.data?.token;
    if (token) this.http.setAccessToken(token);
    return response;
  }

  setAccessToken(token?: string) {
    this.http.setAccessToken(token);
  }

  getAccessToken() {
    return this.http.getAccessTokenValue();
  }

  logout() {
    this.http.setAccessToken(undefined);
  }
}
