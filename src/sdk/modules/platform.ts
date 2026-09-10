import type { Query, RequestOptions } from '../core';
import { SdkModule } from '../module-base';
import type { ApiEnvelope, HealthResponse, JobMatchStatusResponse, SdkRecord } from '../types';

export class ApplicantSourcesModule extends SdkModule {
  list<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>('/api/v1/applicant-sources', query, options);
  }
}

export class DashboardModule extends SdkModule {
  get<T = SdkRecord>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>('/api/v1/dashboard', query, options);
  }
}

export class HealthModule extends SdkModule {
  get<T = ApiEnvelope<HealthResponse>>(options?: RequestOptions) {
    return this.request<T>('GET', '/api/v1/health', options);
  }
}

export class JobMatchStatusModule extends SdkModule {
  get<T = JobMatchStatusResponse>(options?: RequestOptions) {
    return this.request<T>('GET', '/api/v1/job-match-status', options);
  }
}

export class RecruitmentStagesModule extends SdkModule {
  list<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>('/api/v1/recruitment-stages', query, options);
  }
}

export class SettingsModule extends SdkModule {
  get<T = SdkRecord>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>('/api/v1/settings', query, options);
  }
}

export class LogsModule extends SdkModule {
  list<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>('/api/v1/logs', query, options);
  }
}

export class UploadQueueModule extends SdkModule {
  list<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>('/api/v1/upload-queue', query, options);
  }
}
