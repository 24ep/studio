import type {
  InvitationApplicantRow,
  InvitationDataContext,
  InvitationPositionRow,
} from './send-interview-invitation-data';
import type { SendInvitationInput } from './send-interview-invitation-schema';

export interface SendInvitationWorkflowOptions {
  applicantId: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  input: SendInvitationInput;
  data: InvitationDataContext;
  evaluationLink: string | null;
}

export type InvitationOrganizer = {
  name: string;
  email: string;
};

export type InvitationWorkflowResult = {
  interviewerId: string;
  interviewerName: string;
  interviewerEmail: string;
  success: true;
};

export type InvitationWorkflowError = {
  interviewerId: string;
  interviewerName: string;
  interviewerEmail: string;
  error: string;
};

export type InvitationDateTimes = {
  interviewDateTime: Date;
  endDateTime: Date;
};

export type InvitationTemplateVariables = {
  applicantName: string;
  positionTitle: string;
  interviewDate: string;
  interviewTime: string;
  interviewLocation: string;
  evaluationLink: string;
  evaluationQrcodeImage: string;
  interviewerName: string;
};

export interface InvitationBaseContext extends InvitationDateTimes {
  applicant: InvitationApplicantRow;
  position: InvitationPositionRow;
  organizer: InvitationOrganizer;
  input: SendInvitationInput;
  evaluationLink: string | null;
}
