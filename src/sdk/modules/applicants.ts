import type { Query, RequestOptions } from '../core';
import { SdkModule } from '../module-base';
import type { ApiEnvelope, Applicant, ApplicantListData, SdkRecord } from '../types';

export class ApplicantsModule extends SdkModule {
  private path(id?: string) {
    return id ? `/api/v1/applicants/${this.id(id)}` : '/api/v1/applicants';
  }

  list<T = ApiEnvelope<ApplicantListData>>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>(this.path(), query, options);
  }

  create<T = Applicant>(input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', this.path(), input, options);
  }

  getById<T = Applicant>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', this.path(id), options);
  }

  update<T = Applicant>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', this.path(id), input, options);
  }

  delete<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('DELETE', this.path(id), options);
  }

  listAttachments<T = SdkRecord[]>(id: string, query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>(`${this.path(id)}/attachments`, query, options);
  }

  createAttachment<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path(id)}/attachments`, input, options);
  }

  patchAttachments<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PATCH', `${this.path(id)}/attachments`, input, options);
  }

  replaceAttachments<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/attachments`, input, options);
  }

  deleteAttachments<T = SdkRecord>(id: string, input?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('DELETE', `${this.path(id)}/attachments`, input, options);
  }

  uploadAvatar<T = SdkRecord>(id: string, input: FormData | Blob, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path(id)}/avatar`, input, options);
  }

  getAvatar<T = Blob>(id: string, options?: Omit<RequestOptions, 'responseType'>) {
    return this.request<T>('GET', `${this.path(id)}/avatar`, { ...options, responseType: 'blob' });
  }

  getEvaluation<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', `${this.path(id)}/evaluation`, options);
  }

  createEvaluation<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path(id)}/evaluation`, input, options);
  }

  listEvaluations<T = SdkRecord[]>(id: string, query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>(`${this.path(id)}/evaluations`, query, options);
  }

  getEvaluationById<T = SdkRecord>(id: string, evaluationId: string, options?: RequestOptions) {
    return this.request<T>('GET', `${this.path(id)}/evaluation/${this.id(evaluationId)}`, options);
  }

  updateEvaluation<T = SdkRecord>(id: string, evaluationId: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/evaluation/${this.id(evaluationId)}`, input, options);
  }

  deleteEvaluation<T = SdkRecord>(id: string, evaluationId: string, options?: RequestOptions) {
    return this.request<T>('DELETE', `${this.path(id)}/evaluation/${this.id(evaluationId)}`, options);
  }

  getEvaluationLink<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', `${this.path(id)}/evaluation-link`, options);
  }

  createEvaluationLink<T = SdkRecord>(id: string, input?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path(id)}/evaluation-link`, input, options);
  }

  updateEvaluationLink<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/evaluation-link`, input, options);
  }

  deleteEvaluationLink<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('DELETE', `${this.path(id)}/evaluation-link`, options);
  }

  getJobApplied<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', `${this.path(id)}/job-applied`, options);
  }

  createJobApplied<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path(id)}/job-applied`, input, options);
  }

  updateJobApplied<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/job-applied`, input, options);
  }

  deleteJobApplied<T = SdkRecord>(id: string, input?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('DELETE', `${this.path(id)}/job-applied`, input, options);
  }

  listJobMatches<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', `${this.path(id)}/job-matches`, options);
  }

  createJobMatches<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path(id)}/job-matches`, input, options);
  }

  patchJobMatches<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PATCH', `${this.path(id)}/job-matches`, input, options);
  }

  replaceJobMatches<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/job-matches`, input, options);
  }

  deleteJobMatches<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('DELETE', `${this.path(id)}/job-matches`, options);
  }

  addJobMatch<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path(id)}/job-matches/add`, input, options);
  }

  getJobMatch<T = SdkRecord>(id: string, matchId: string, options?: RequestOptions) {
    return this.request<T>('GET', `${this.path(id)}/job-matches/${this.id(matchId)}`, options);
  }

  updateJobMatch<T = SdkRecord>(id: string, matchId: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/job-matches/${this.id(matchId)}`, input, options);
  }

  deleteJobMatch<T = SdkRecord>(id: string, matchId: string, options?: RequestOptions) {
    return this.request<T>('DELETE', `${this.path(id)}/job-matches/${this.id(matchId)}`, options);
  }

  getRecruiter<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', `${this.path(id)}/recruiter`, options);
  }

  updateRecruiter<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/recruiter`, input, options);
  }

  deleteRecruiter<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('DELETE', `${this.path(id)}/recruiter`, options);
  }

  listResumes<T = SdkRecord[]>(id: string, query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>(`${this.path(id)}/resumes`, query, options);
  }

  createResume<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path(id)}/resumes`, input, options);
  }

  updateResume<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/resumes`, input, options);
  }

  deleteResume<T = SdkRecord>(id: string, input?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('DELETE', `${this.path(id)}/resumes`, input, options);
  }

  getSource<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', `${this.path(id)}/source`, options);
  }

  updateSource<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', `${this.path(id)}/source`, input, options);
  }

  bulkAction<T = SdkRecord>(input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path()}/bulk-action`, input, options);
  }

  bulkUploadCv<T = SdkRecord>(input: FormData, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path()}/bulk-upload-cv`, input, options);
  }

  clearDuplicates<T = SdkRecord>(input?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path()}/clear-duplicates`, input, options);
  }

  exportData(query?: Query, options?: Omit<RequestOptions, 'query' | 'responseType'>) {
    return this.getRequest<Blob>(`${this.path()}/export`, query, { ...options, responseType: 'blob' });
  }

  importData<T = SdkRecord>(input: FormData, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path()}/import`, input, options);
  }

  getImportTemplate(options?: Omit<RequestOptions, 'responseType'>) {
    return this.request<Blob>('GET', `${this.path()}/import`, { ...options, responseType: 'blob' });
  }
}
