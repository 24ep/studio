# Journey details comparison audit

Date: 2026-08-12

## Audit scope

- Surface: Journey details on `/people/onboarding`.
- User goal: confirm whether the implemented drawer matches the selected onboarding proposal.
- Proposal: `C:\Users\User\.codex\generated_images\019ff194-b810-7ad3-a0d2-fcd8f9c2a9a2\exec-b6b99eed-456a-4c9e-baa1-f1ad0580aa8f.png`.
- Current capture: `E:\GitCloneProject\studio-1\audit-current-journey-details.png`.

## Step 1 — Open Journey details

Health: needs alignment.

### Strengths

- Employee identity, readiness, blocker, next action, progress, and full-journey navigation are still present.
- The close control is visible and the drawer opens from an employee row.

### UX and visual differences

1. The proposal uses an approximately 324px integrated sidebar with no backdrop. The current implementation uses a 420px floating modal drawer with a dimmed backdrop. This difference follows the later floating-drawer annotation, but it no longer matches the original proposal.
2. The proposal heads the panel with the employee name. The current drawer adds a generic `Journey details` header and repeats the employee name below it.
3. The proposal uses a five-stage `Journey progress` list: Personal information, Employment details, Equipment, Compliance, and Orientation. The current drawer replaces it with three generic time phases: Before start, First week, and First 30 days.
4. The proposal keeps blocker and next-action due information visible. The current live state uses shorter helper copy and omits the proposed due-date emphasis.
5. The proposal ends with a restrained `View full journey` text link. The current drawer adds a large primary button, a Profile button, and a Prioritized actions table, changing the hierarchy and density.
6. The proposal has more compact vertical spacing and lighter separators. The current drawer uses larger cards and stronger section blocks.

### Accessibility risks visible from the capture

- Several muted labels in the dark drawer are very small and low contrast.
- The dimmed page makes the drawer clearly modal, while the proposal behaves like a persistent inspector; this changes keyboard and screen-reader expectations.

### Evidence limits

- Live employee data differs from the illustrative proposal, so names, dates, percentages, and task availability should not be treated as fidelity defects.
- Screenshots alone do not confirm focus trapping, keyboard order, or screen-reader announcements.

## Recommendation

Keep the requested floating shell, but restore the proposal’s internal structure: employee-name header, compact employee metadata, readiness, blocker with due state, next action with due state, five-stage journey-progress list, and a single quiet full-journey link. Remove the generic phase cards, Prioritized actions table, and Profile action unless they are required product behavior.
