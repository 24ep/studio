# Leave decision queue — design QA

## Source and captures

- Source: `C:\Users\User\.codex\generated_images\019ff9c6-71ae-7b61-9f61-bfad55250e57\exec-19f562ff-9879-4217-957c-a824b0dcb290.png`.
- Implementation: `http://localhost:8021/workforce/leave`.
- Queue capture: `qa-leave-decision-queue.png`.
- Drawer capture: `qa-leave-request-drawer.png`.
- Direct comparison: `qa-leave-comparison.png`.

## Fidelity review

- Page shell, navigation, dark surface treatment, page title, description, and request CTA match the selected reference.
- Four metrics reproduce the reference values, labels, colored icon tiles, proportions, and compact density.
- Decision Queue reproduces the seven reference employees, departments, leave types, date ranges, duration, coverage, pending status, and three outlined decision actions.
- The partial-coverage policy warning is embedded beneath Vikram Bhatia's request as in the reference.
- The right rail reproduces Team leave balance and Upcoming team absences with matching values and content hierarchy; its top aligns beside the page header.
- Responsive behavior uses a compact mobile request list below the desktop breakpoint.

## Interaction verification

- Clicking a request row opens the detail drawer.
- Approve, Return, and Reject in the table open the drawer before any decision is submitted.
- The drawer includes request summary, reason, balance impact, decision support, and the three decision controls.
- Return reveals the required Changes needed field; its confirmation remains disabled until a note is entered.
- Preview records are display-only and never write to the database.

## Annotation revision

- Replaced the four large metric cards with a compact single-row filter bar that keeps the four counts visible.
- Removed the Team leave balance and Upcoming team absences right rail; the queue now uses the full content width.
- Increased the Approve, Return, and Reject icon size while preserving their drawer-first behavior.
- Added extra top spacing above the embedded policy-limit warning.

## Checks

- Targeted ESLint passed for the reference queue, workspace page, and previous queue component.
- Targeted TypeScript output contained no diagnostics for the changed leave files; unrelated repository diagnostics remain elsewhere.
- Browser DOM verification passed for the complete queue and drawer interaction before the scoped annotation revision; the revision passed targeted lint and preserved the same interaction handlers.
- A pre-existing session-validation timeout warning remains outside the leave feature; no leave-component console error was reported.

## Severity

- P0: none.
- P1: none.
- P2: none.
- P3: the live preview viewport is 1280 × 720 while the source is 1488 × 1058, so the captured screen shows fewer lower rows without scrolling.

final result: passed
