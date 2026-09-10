import type { RequestOptions } from '../core';
import { SdkModule } from '../module-base';
import type { Applicant, SdkRecord } from '../types';

export interface ApplicantSearchResponse extends SdkRecord {
  applicants?: Applicant[];
  results?: Applicant[];
}

export class AiModule extends SdkModule {
  searchApplicants<T = ApplicantSearchResponse>(input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', '/api/v1/ai/search-applicants', input, options);
  }
}

