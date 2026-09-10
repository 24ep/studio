import type { Query, RequestOptions } from '../core';
import { SdkModule } from '../module-base';
import type { SdkRecord } from '../types';

export type EvaluationCatalog =
  | 'expertise-groups'
  | 'expertise-skills'
  | 'personality-groups'
  | 'personality-traits'
  | 'skill-templates';

export class EvaluationsModule extends SdkModule {
  private catalogPath(catalog: EvaluationCatalog, id?: string) {
    const path = `/api/v1/evaluation/${catalog}`;
    return id ? `${path}/${this.id(id)}` : path;
  }

  list<T = SdkRecord[]>(catalog: EvaluationCatalog, query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>(this.catalogPath(catalog), query, options);
  }

  create<T = SdkRecord>(catalog: EvaluationCatalog, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('POST', this.catalogPath(catalog), input, options);
  }

  getById<T = SdkRecord>(catalog: EvaluationCatalog, id: string, options?: RequestOptions) {
    return this.request<T>('GET', this.catalogPath(catalog, id), options);
  }

  update<T = SdkRecord>(catalog: EvaluationCatalog, id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PUT', this.catalogPath(catalog, id), input, options);
  }

  delete<T = SdkRecord>(catalog: EvaluationCatalog, id: string, options?: RequestOptions) {
    return this.request<T>('DELETE', this.catalogPath(catalog, id), options);
  }

  listExpertiseGroups<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.list<T>('expertise-groups', query, options);
  }

  listExpertiseSkills<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.list<T>('expertise-skills', query, options);
  }

  listPersonalityGroups<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.list<T>('personality-groups', query, options);
  }

  listPersonalityTraits<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.list<T>('personality-traits', query, options);
  }

  listSkillTemplates<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.list<T>('skill-templates', query, options);
  }

  listLinks<T = SdkRecord[]>(query?: Query, options?: Omit<RequestOptions, 'query'>) {
    return this.getRequest<T>('/api/v1/evaluation/links', query, options);
  }

  updateLink<T = SdkRecord>(id: string, input: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.mutation<T>('PATCH', `/api/v1/evaluation/links/${this.id(id)}`, input, options);
  }

  deleteLink<T = SdkRecord>(id: string, options?: RequestOptions) {
    return this.request<T>('DELETE', `/api/v1/evaluation/links/${this.id(id)}`, options);
  }
}
