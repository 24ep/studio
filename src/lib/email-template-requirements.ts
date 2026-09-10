export type EmailTemplateRequirement = {
  code: string;
  name: string;
  category: string;
  description: string;
  required: true;
};

export const EMAIL_TEMPLATE_REQUIREMENTS: EmailTemplateRequirement[] = [
  { code: 'application_received', name: 'Application received', category: 'Recruitment', description: 'Confirms that a candidate application was received.', required: true },
  { code: 'new_application_alert', name: 'New application alert', category: 'Recruitment', description: 'Notifies the recruiting team about a new applicant.', required: true },
  { code: 'applicant_status_changed', name: 'Applicant status changed', category: 'Recruitment', description: 'Keeps candidates informed when their application moves stage.', required: true },
  { code: 'candidate_shortlisted', name: 'Candidate shortlisted', category: 'Recruitment', description: 'Tells a candidate they have progressed to the shortlist.', required: true },
  { code: 'interview_invitation', name: 'Interview invitation', category: 'Interview', description: 'Sends interview details, evaluation links, and calendar information.', required: true },
  { code: 'interview_rescheduled', name: 'Interview rescheduled', category: 'Interview', description: 'Confirms a change to an interview schedule.', required: true },
  { code: 'interview_cancelled', name: 'Interview cancelled', category: 'Interview', description: 'Notifies participants that an interview was cancelled.', required: true },
  { code: 'offer_letter', name: 'Offer letter', category: 'Offer', description: 'Delivers the employment offer and acceptance link.', required: true },
  { code: 'offer_reminder', name: 'Offer reminder', category: 'Offer', description: 'Reminds a candidate about a pending offer.', required: true },
  { code: 'employee_password_setup', name: 'Employee password setup', category: 'Onboarding', description: 'Invites a new employee to activate their account.', required: true },
  { code: 'onboarding_invitation', name: 'Onboarding invitation', category: 'Onboarding', description: 'Starts the employee onboarding workflow.', required: true },
  { code: 'onboarding_task_reminder', name: 'Onboarding task reminder', category: 'Onboarding', description: 'Reminds employees or task owners about incomplete onboarding work.', required: true },
  { code: 'document_issued', name: 'Employee document issued', category: 'Employee', description: 'Notifies an employee that a document is ready.', required: true },
  { code: 'document_expiry_reminder', name: 'Document expiry reminder', category: 'Employee', description: 'Warns employees and HR before an employment document expires.', required: true },
  { code: 'employee_profile_update_required', name: 'Profile update required', category: 'Employee', description: 'Requests missing or updated employee information.', required: true },
  { code: 'employee_survey_invitation', name: 'Employee survey invitation', category: 'Survey', description: 'Invites employees to complete an engagement, pulse, or HR survey.', required: true },
  { code: 'employee_survey_reminder', name: 'Employee survey reminder', category: 'Survey', description: 'Reminds employees about an open survey before its deadline.', required: true },
  { code: 'employee_survey_completed', name: 'Survey completion confirmation', category: 'Survey', description: 'Confirms that an employee survey response was received.', required: true },
  { code: 'leave_status_changed', name: 'Leave request status', category: 'Leave', description: 'Communicates leave approval, rejection, or cancellation.', required: true },
  { code: 'leave_balance_warning', name: 'Leave balance warning', category: 'Leave', description: 'Alerts an employee when requested leave exceeds the available balance.', required: true },
  { code: 'attendance_exception', name: 'Attendance exception', category: 'Attendance', description: 'Flags a missed clock event, absence, or attendance anomaly.', required: true },
  { code: 'timesheet_submission_reminder', name: 'Timesheet submission reminder', category: 'Attendance', description: 'Reminds employees to submit outstanding timesheets.', required: true },
  { code: 'timesheet_status_changed', name: 'Timesheet status changed', category: 'Attendance', description: 'Communicates timesheet approval, rejection, or requested changes.', required: true },
  { code: 'shift_schedule_published', name: 'Shift schedule published', category: 'Attendance', description: 'Notifies employees when a new work schedule is available.', required: true },
  { code: 'shift_schedule_changed', name: 'Shift schedule changed', category: 'Attendance', description: 'Alerts employees about a change to an assigned shift.', required: true },
  { code: 'payslip_available', name: 'Payslip available', category: 'Payroll', description: 'Notifies an employee that a new payslip is ready to view.', required: true },
  { code: 'payroll_information_required', name: 'Payroll information required', category: 'Payroll', description: 'Requests missing bank, tax, or payroll information.', required: true },
  { code: 'performance_review_assigned', name: 'Performance review assigned', category: 'Performance', description: 'Notifies a reviewer or employee about a review task.', required: true },
  { code: 'performance_review_reminder', name: 'Performance review reminder', category: 'Performance', description: 'Reminds participants to complete an outstanding review.', required: true },
  { code: 'performance_review_completed', name: 'Performance review completed', category: 'Performance', description: 'Confirms that a review cycle or individual review is complete.', required: true },
  { code: 'goal_checkin_reminder', name: 'Goal check-in reminder', category: 'Performance', description: 'Prompts employees and managers to update goals or complete a check-in.', required: true },
  { code: 'training_assigned', name: 'Training assigned', category: 'Learning', description: 'Notifies an employee about a newly assigned course or learning path.', required: true },
  { code: 'training_due_reminder', name: 'Training due reminder', category: 'Learning', description: 'Reminds an employee before required training becomes overdue.', required: true },
  { code: 'training_completed', name: 'Training completion', category: 'Learning', description: 'Confirms course completion or certificate availability.', required: true },
  { code: 'expense_status_changed', name: 'Expense request status', category: 'Expenses', description: 'Communicates expense approval, rejection, or reimbursement.', required: true },
  { code: 'company_announcement', name: 'Company announcement', category: 'Communication', description: 'Delivers an approved organization-wide HR announcement.', required: true },
  { code: 'policy_acknowledgement_required', name: 'Policy acknowledgement required', category: 'Communication', description: 'Requests employee review and acknowledgement of a policy.', required: true },
  { code: 'resignation_acknowledged', name: 'Resignation acknowledged', category: 'Offboarding', description: 'Confirms receipt of an employee resignation.', required: true },
  { code: 'exit_interview_invitation', name: 'Exit interview invitation', category: 'Offboarding', description: 'Invites a departing employee to an exit interview or survey.', required: true },
  { code: 'offboarding_task_reminder', name: 'Offboarding task reminder', category: 'Offboarding', description: 'Reminds responsible people about incomplete clearance tasks.', required: true },
  { code: 'termination_notice', name: 'Termination notice', category: 'Offboarding', description: 'Delivers an approved employment termination notice.', required: true },
  { code: 'email_verification_code', name: 'Email verification code', category: 'System', description: 'Verifies ownership of an account email address.', required: true },
  { code: 'account_locked_alert', name: 'Account locked alert', category: 'System', description: 'Warns a user that their account has been locked.', required: true },
];
