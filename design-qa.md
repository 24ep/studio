# Development Plan redesign — design QA

## Evidence

- Source visual truth (list): `C:/Users/User/.codex/generated_images/019ffa6e-67f7-7523-850e-7c75d63c1cc3/exec-f5b430ca-93e0-442e-81ed-186298f0c4e5.png`
- Source visual truth (detail): `C:/Users/User/.codex/generated_images/019ffa6e-67f7-7523-850e-7c75d63c1cc3/exec-724c7a7c-b4b9-4a01-a304-1bee19db05a8.png`
- Implementation screenshot (list): `E:/GitCloneProject/studio-1/development-plan-list-final-v2.png`
- Implementation screenshot (detail): `E:/GitCloneProject/studio-1/development-plan-detail-final-v3.png`
- Side-by-side comparison (list): `E:/GitCloneProject/studio-1/development-plan-list-qa-comparison-final-v2.png`
- Side-by-side comparison (detail): `E:/GitCloneProject/studio-1/development-plan-detail-qa-comparison-final-v3.png`
- Browser route: `http://localhost:8022/workforce/performance?tab=development`
- CSS viewport and device scale: 1280 × 720 at 1x.
- Source pixels: 1672 × 941 for each generated reference.
- Implementation pixels: 1280 × 720 for each browser capture.
- Density normalization: both source visuals and implementation captures were normalized to 1280 × 720 before being placed side by side. The comparison therefore evaluates hierarchy, proportions, tokens, and interaction state without a pixel-density mismatch.
- States: Development plans list; Strengthen strategic account planning detail; create-plan sheet opened and closed.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: the implementation uses the product's existing UI type stack and matches the reference's compact enterprise hierarchy, weights, readable body sizing, and tabular progress values. The narrower live shell causes the longest first-row title to wrap at 1280px; this is an acceptable responsive adaptation and remains fully legible.
- Spacing and layout rhythm: the plan list remains the dominant entry surface, uses lightweight row separators, and preserves the reference's summary-to-table-to-learning rhythm. Detail content keeps the primary work area and accountability rail. The existing 280px Team Members rail is wider than the generated reference; retaining it is an intentional product-shell constraint.
- Colors and visual tokens: navy navigation, blue primary actions, neutral dividers, green completion, amber urgency, and violet coaching/competency accents align with the source and existing product tokens. Contrast remains clear in both states.
- Image quality and asset fidelity: the screens contain no custom raster imagery. Existing brand assets and the product's established icon library render sharply; no placeholder, emoji, CSS-art, or substitute logo assets were introduced.
- Copy and content: list metrics, plan names, competencies, progress, dates, ownership, statuses, learning links, plan purpose, target outcome, action plan, evidence, coaching prompt, and next-best-action copy all match the approved concepts and the Aug 13, 2026 date anchor.
- Interaction and affordance: all plan rows are keyboard-focusable buttons; the selected row opens the goal detail; Back returns to the list; Create development plan opens the existing creation sheet; the sheet closes correctly. Browser console contained no warnings or errors during these checks.
- Responsiveness and accessibility: the desktop table retains all required columns at the target breakpoint and gains horizontal overflow protection for narrower content widths. Focus rings, semantic buttons, link destinations, progress semantics, headings, and text labels are present.

## Focused-region comparison

- List header and rows were reviewed at readable scale because this is the densest fidelity surface. The initial implementation omitted the dedicated Status column; the final capture shows separate Status and View columns with Active/Completed labels matching the source.
- The detail action plan and right rail were reviewed at readable scale. Purpose, outcome, progress, action statuses, evidence affordances, accountability, related competency, coaching prompt, and learning recommendations preserve the selected design's information order.

## Comparison history

1. Initial list comparison found a P2 information mismatch: status was not a dedicated desktop column and active plans displayed the generic `In progress` label.
2. Fix applied: added a responsive Status column, kept View separate, added horizontal overflow protection, removed duplicate compact status rendering, and mapped non-completed list plans to the approved `Active` label.
3. Post-fix evidence: `development-plan-list-qa-comparison-final-v2.png` shows Status and View aligned with the source; browser DOM verification found two Active badges and one Completed badge.
4. The detail screenshot was recaptured at page scroll position 0 and compared in `development-plan-detail-qa-comparison-final-v3.png`.

## Implementation checklist

- [x] Default Development Plan state shows the plan list first.
- [x] Plan row opens a complete detail workspace.
- [x] Back navigation returns to the list.
- [x] Create development plan opens the existing composer.
- [x] Learning recommendations remain visible without competing with the plan list.
- [x] Browser interaction and console checks pass.
- [x] Scoped lint passes.

## Follow-up polish

- P3: a later shell-wide responsive pass could reduce the Team Members rail at 1280px to expose more action rows above the fold. This is outside the Development Plan component and does not block the approved flow.

final result: passed

---

# ESS My Requests redesign — design QA

## Evidence

- Source visual truth: `C:/Users/User/.codex/generated_images/019ffb50-a17a-7ca1-950b-8b37a680b254/exec-a716de78-a072-4886-9e83-b75adb8fcbf9.png`
- Implementation screenshot: `E:/GitCloneProject/studio-1/qa-ess-leave-my-requests.png`
- Full side-by-side comparison: `E:/GitCloneProject/studio-1/qa-ess-leave-my-requests-comparison.png`
- Focused workspace comparison: `E:/GitCloneProject/studio-1/qa-ess-leave-my-requests-focused.png`
- Browser route: `http://localhost:8031/ess/leave?preview=leave`
- CSS viewport and device scale: 1488 × 1058 at 1x.
- Source pixels: 1488 × 1058.
- Implementation pixels: 1488 × 1058.
- Density normalization: none required; the reference and implementation were compared at identical dimensions.
- State: populated My Requests list with all filters reset, leave balances visible, and the pending request selected as the next time away.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Layout and hierarchy: the prominent My Requests heading, Request leave CTA, three-balance strip, filterable request table, and approval rail preserve the selected concept's information order. The production product's established global and ESS navigation remain intact, resulting in a denser vertical shell than the concept; this is an intentional product-context constraint.
- Colors and typography: the local dark workspace, blue primary action, neutral card surfaces, and green/amber/gray statuses match the selected visual direction while using the product's existing tokens and typography.
- Content fidelity: realistic annual, personal, and sick leave rows include dates, duration, status, submitted date, and coverage. The next-time-away card prioritizes the pending annual leave request and shows its approval progress.
- Interaction: Request leave opens the validated form; View balances opens the balance detail dialog; All/Pending/Approved/Drafts filters work; search narrows the table to the matching request; row View and overflow controls open request details; request lifecycle actions remain available in the detail dialog.
- Accessibility and resilience: semantic headings, tabs, table-like row structure, labeled search/year controls, focusable buttons, responsive fallbacks, and full-height dark surface were verified at the target viewport.
- Browser console: no errors were present after the final reload and interaction pass.

## Focused-region comparison

- The header, balance strip, filter bar, five request rows, and right approval rail were reviewed together at readable scale in `qa-ess-leave-my-requests-focused.png`.
- Relative proportions, column order, status hierarchy, request-row density, and CTA placement follow the selected source. The implementation uses the existing product shell and compact product typography rather than replacing global navigation or brand components.

## Comparison history

1. The initial rendered pass used a light content surface and displayed detailed balance cards below the main table.
2. Fix applied: moved balance details into an on-demand dialog and introduced the dark selected-design workspace.
3. The next pass exposed inline lifecycle actions in every row and allowed the content surface to end before the viewport.
4. Fix applied: moved lifecycle actions into the request-detail dialog, prioritized the pending request in the approval rail, removed the development-only employee-link warning from the preview fixture, and extended the dark surface to the full viewport.
5. Final browser checks confirmed the Request leave, balance, filters, search, and detail flows. Scoped ESLint and full TypeScript checks passed.

## Follow-up polish

- P3: if a future shell-wide redesign removes the secondary ESS navigation, the content could adopt the concept's roomier table rows and footer placement. This is outside the requested leave-screen implementation and does not block the flow.

final result: passed
