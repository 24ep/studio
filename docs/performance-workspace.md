# Performance workspace

## Current-state assessment

- `/workforce/performance` was a coming-soon route.
- Formal review data already exists in `hr_performance_cycles` and `hr_performance_reviews`.
- Employee self-assessment, review acknowledgment, and goal updates already exist in `/ess/performance` and `/api/ess/performance`.
- Goal records currently use `hr_performance_goals`; no separate Goal workflow route exists yet.
- Employee hierarchy is sourced from `hr_employees.manager_id`; organization structure is not duplicated.
- Authorization is sourced from the authenticated session, module permissions, and the employee hierarchy.
- Shared notification and audit services already exist and are reused.

## Gap analysis

The application lacked continuous-performance records and a consolidated role-aware view. This implementation adds additive records for:

- Check-ins with separated employee draft, shared, and manager-private notes.
- Continuous feedback and feedback requests.
- Employee recognition.
- Competency evidence.
- Development plans and development actions.
- Performance activity events.

Alerts and insights are calculated from stored due dates, statuses, progress, and released results. They are not persisted as synthetic scores.

## Information architecture

1. Overview
2. My Performance
3. Check-ins
4. Feedback and Recognition
5. Competencies
6. Development Plan
7. Performance History
8. Team Performance (manager/HR/administrator only)
9. Insights

Required actions are prioritized on Overview. Team tables become employee cards on small screens, and the team preview uses a focused detail drawer.

## Ownership boundaries

- **Performance:** overview, continuous feedback, recognition, check-ins, competency summaries/evidence, development actions, history, team overview, alerts, and consolidated insights.
- **Appraisal:** `hr_performance_cycles`, `hr_performance_reviews`, self-assessment, manager assessment, ratings, release, and acknowledgment. Performance reads these records and links to the existing ESS formal-review surface.
- **Goal:** `hr_performance_goals`, progress, status, approval, and key results. Performance shows read-only summaries and links to the existing ESS goal surface.
- **Learning:** courses, paths, enrollments, and completion. Performance development actions may link to Learning but do not manage courses.
- **Organization:** `hr_employees.manager_id` and `hr_departments` remain the hierarchy source.

## Permissions

The backend enforces:

- Employee access to their own record.
- Manager access to direct reports.
- HR/administrator access through `HR_PERFORMANCE_VIEW` or `HR_PERFORMANCE_MANAGE`.
- Company isolation when company IDs are populated.
- Anonymous-provider masking.
- Review-stage rating visibility.
- Employee-draft and manager-private note field filtering.

The UI mirrors these permissions but is not the enforcement boundary.

## Setup

```powershell
npx prisma migrate deploy
npx prisma generate
npm run seed:performance
```

Run `npm run seed:hr` before `npm run seed:performance` when the HR demo employees do not exist.

## Assumptions and remaining dependencies

- The current ESS performance flow is treated as the available Appraisal and Goal interaction surface until dedicated Appraisal and Goal routes replace the current coming-soon navigation entries.
- Anonymous feedback is disabled unless `PERFORMANCE_ANONYMOUS_FEEDBACK_ENABLED=true`.
- Department-restricted HR scope requires a future department-scope permission policy; current HR performance permissions are organization-wide within company scope.
- Attachment metadata is modeled, but binary upload continues to depend on the shared upload infrastructure and is not duplicated here.
- Recurring check-in rules are stored for a scheduler to expand; no disconnected scheduler service was introduced.
- Production notification reminders for approaching due dates require the application’s scheduler/worker integration.
