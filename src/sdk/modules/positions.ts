import type { Query, RequestOptions } from '../core';
import { SdkModule } from '../module-base';
import type { ApiEnvelope, Position, PositionListData, SdkRecord } from '../types';

type EvaluationResource = 'expertise-groups' | 'expertise-skills' | 'personality-groups' | 'personality-traits';

export class PositionsModule extends SdkModule {
  private path(id?: string) {
    return id ? `/api/v1/positions/${this.id(id)}` : '/api/v1/positions';
  }

  private evaluationPath(id: string, resource?: EvaluationResource, assignmentId?: string) {
    let path = `${this.path(id)}/evaluation`;
    if (resource) path += `/${resource}`;
    if (assignmentId) path += `/${this.id(assignmentId)}`;
    return path;
  }

  list<T = ApiEnvelope<PositionListData>>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>(this.path(), query, options);
  }

  create<T = Position>(input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', this.path(), input, options);
  }

  getById<T = Position>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', this.path(id), options);
  }

  update<T = Position>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', this.path(id), input, options);
  }

  delete<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('DELETE', this.path(id), options);
  }

  getEvaluation<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('GET', this.evaluationPath(id), options);
  }

  assignEvaluationResource<T = SdkRecord>(id: string, resource: EvaluationResource, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', this.evaluationPath(id, resource), input, options);
  }

  updateEvaluationAssignment<T = SdkRecord>(id: string, resource: EvaluationResource, assignmentId: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', this.evaluationPath(id, resource, assignmentId), input, options);
  }

  deleteEvaluationAssignment<T = SdkRecord>(id: string, resource: EvaluationResource, assignmentId: string, options?: RequestOptions) {
    return this.request<T>('DELETE', this.evaluationPath(id, resource, assignmentId), options);
  }

  assignExpertiseGroup<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.assignEvaluationResource<T>(id, 'expertise-groups', input, options);
  }

  assignExpertiseSkill<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.assignEvaluationResource<T>(id, 'expertise-skills', input, options);
  }

  assignPersonalityGroup<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.assignEvaluationResource<T>(id, 'personality-groups', input, options);
  }

  assignPersonalityTrait<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.assignEvaluationResource<T>(id, 'personality-traits', input, options);
  }

  bulkAction<T = SdkRecord>(input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', `${this.path()}/bulk-action`, input, options);
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

export type { EvaluationResource };
