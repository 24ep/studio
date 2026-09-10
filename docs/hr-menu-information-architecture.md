# HR Menu Information Architecture

The HR navigation is organized around the way modern HRIS/HCM products support the employee lifecycle:

- **Dashboard**: HR and recruitment reporting entry point.
- **Recruitment**: applicant tracking, candidates, positions, interviews, offers, and processing queues.
- **People**: employee system of record, departments, onboarding, and employee documents.
- **Workforce**: attendance, leave, performance, learning, and schedule-related work.
- **Payroll**: payroll runs, payslips, compensation, benefits, and payroll reporting.
- **Admin**: platform configuration, permissions, workflows, branding, integrations, and audit logs.

This structure follows common HR technology categories described by SHRM, Workday HCM, and BambooHR: core HR records, applicant tracking, onboarding, time and attendance, leave, payroll, benefits, performance, learning, analytics, and administration.

Implementation rules:

- Primary sidebar items represent broad HR departments or operational domains.
- Secondary sidebar items represent frequent workflows within that domain.
- Sidebar links should point only to real routes.
- Recruitment remains connected to the existing ATS features, while People, Workforce, and Payroll use dedicated HR module routes.
- Payroll V1 stores periods, run totals, payslips, compensation, benefits, and adjustments; it does not calculate statutory tax or legal payroll obligations.
