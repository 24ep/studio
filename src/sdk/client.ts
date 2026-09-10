import { HriveHttpClient, type HriveClientOptions, type RequestOptions } from './core';
import { AiModule } from './modules/ai';
import { ApplicantsModule } from './modules/applicants';
import { AuthModule } from './modules/auth';
import { EvaluationsModule } from './modules/evaluations';
import { NotificationsModule } from './modules/notifications';
import {
  ApplicantSourcesModule,
  DashboardModule,
  HealthModule,
  JobMatchStatusModule,
  LogsModule,
  RecruitmentStagesModule,
  SettingsModule,
  UploadQueueModule,
} from './modules/platform';
import { PositionsModule } from './modules/positions';
import { TransitionsModule } from './modules/transitions';
import { UsersModule } from './modules/users';

export class HriveClient {
  readonly auth: AuthModule;
  readonly applicants: ApplicantsModule;
  readonly applicantSources: ApplicantSourcesModule;
  readonly positions: PositionsModule;
  readonly evaluations: EvaluationsModule;
  readonly users: UsersModule;
  readonly dashboard: DashboardModule;
  readonly health: HealthModule;
  readonly jobMatchStatus: JobMatchStatusModule;
  readonly recruitmentStages: RecruitmentStagesModule;
  readonly transitions: TransitionsModule;
  readonly settings: SettingsModule;
  readonly logs: LogsModule;
  readonly notifications: NotificationsModule;
  readonly uploadQueue: UploadQueueModule;
  readonly ai: AiModule;

  private readonly http: HriveHttpClient;

  constructor(options: HriveClientOptions) {
    this.http = new HriveHttpClient(options);
    this.auth = new AuthModule(this.http);
    this.applicants = new ApplicantsModule(this.http);
    this.applicantSources = new ApplicantSourcesModule(this.http);
    this.positions = new PositionsModule(this.http);
    this.evaluations = new EvaluationsModule(this.http);
    this.users = new UsersModule(this.http);
    this.dashboard = new DashboardModule(this.http);
    this.health = new HealthModule(this.http);
    this.jobMatchStatus = new JobMatchStatusModule(this.http);
    this.recruitmentStages = new RecruitmentStagesModule(this.http);
    this.transitions = new TransitionsModule(this.http);
    this.settings = new SettingsModule(this.http);
    this.logs = new LogsModule(this.http);
    this.notifications = new NotificationsModule(this.http);
    this.uploadQueue = new UploadQueueModule(this.http);
    this.ai = new AiModule(this.http);
  }

  /** Escape hatch for platform endpoints introduced after this SDK version. */
  request<T = unknown>(method: string, path: string, options?: RequestOptions) {
    return this.http.request<T>(method.toUpperCase(), path, options);
  }
}

export function createHriveClient(options: HriveClientOptions) {
  return new HriveClient(options);
}

