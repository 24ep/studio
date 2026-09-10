const FULL_PAGE_DIALOG_CSS = `
[data-radix-dialog-content] {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  border-radius: 0 !important;
}`;

const PRINT_LAYOUT_CSS = `
@page { margin: 0.5cm; size: A4; }
body {
  transform: scale(0.7);
  transform-origin: top left;
  width: 142.85%;
}
.min-h-screen > div { padding: 0 !important; }
.no-print { display: none !important; }
button[onClick*="handlePrint"],
button:has(svg.lucide-printer),
button:has(.lucide-printer),
button .lucide-printer,
button:has(span:contains("Print")) { display: none !important; }
button {
  pointer-events: none !important;
  cursor: default !important;
}
input[type="number"] {
  border: none !important;
  background: transparent !important;
  pointer-events: none !important;
  -webkit-appearance: none;
  -moz-appearance: textfield;
}
.evaluate-card-rounded-top {
  box-shadow: none !important;
  border: 1px solid #e5e7eb !important;
}`;

const PRINT_RESPONSIVE_OVERRIDES_CSS = `
* { max-width: none !important; }
.grid { display: grid !important; }
.md\\:grid-cols-2,
.lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
.sm\\:flex-row { flex-direction: row !important; }
.sm\\:items-center { align-items: center !important; }
.sm\\:justify-between { justify-content: space-between !important; }
.sm\\:text-right { text-align: right !important; }
.sm\\:text-left { text-align: left !important; }
.sm\\:inline,
.hidden.sm\\:inline { display: inline !important; }`;

const PRINT_SPACING_CSS = `
body,
.min-h-screen {
  padding: 0 !important;
  margin: 0 !important;
}
[class*="p-8"],
[class*="p-12"],
[class*="px-8"],
[class*="px-12"],
[class*="py-8"],
[class*="py-12"] { padding: 0.5rem !important; }
[class*="space-y-8"] { gap: 1rem !important; }
[class*="mb-8"],
[class*="mb-6"] { margin-bottom: 0.75rem !important; }
[class*="pb-6"],
[class*="pb-4"] { padding-bottom: 0.5rem !important; }
[class*="pt-6"],
[class*="pt-4"] { padding-top: 0.5rem !important; }
[class*="p-4"],
[class*="p-6"] { padding: 0.75rem !important; }
[class*="gap-4"],
[class*="gap-6"],
[class*="gap-8"] { gap: 0.5rem !important; }
[class*="CardContent"] { padding: 0.5rem !important; }
.space-y-8 > * + * { margin-top: 0.75rem !important; }`;

const PRINT_DISCLOSURE_AND_COLOR_CSS = `
.border-t.bg-muted\\/20,
.border.rounded-md .border-t { display: block !important; }
* { transition: none !important; }
.space-y-1 > div,
.space-y-4 > div { page-break-inside: avoid; }
* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.lucide-chevron-right,
.lucide-chevron-down { display: none !important; }`;

const PRINT_TABLE_CSS = `
table {
  width: 100% !important;
  border-collapse: collapse !important;
  table-layout: auto !important;
}
th, td {
  padding: 0.5rem !important;
  text-align: left !important;
  border: none !important;
  vertical-align: top !important;
}
th {
  background-color: transparent !important;
  font-weight: 600 !important;
}
table.border-0,
table.border-0 th,
table.border-0 td,
table.border-0 tr { border: none !important; }
th.text-left,
td.text-left { text-align: left !important; }
th.text-right,
td.text-right { text-align: right !important; }
th.text-center,
td.text-center { text-align: center !important; }
tr { page-break-inside: avoid !important; }`;

const PRINT_FLEX_AND_TABLE_CONTAINER_CSS = `
.flex { display: flex !important; }
.items-center { align-items: center !important; }
.justify-between { justify-content: space-between !important; }
.justify-end { justify-content: flex-end !important; }
.grid { display: grid !important; }
.overflow-auto { overflow: visible !important; }
[class*="Table"] { width: 100% !important; }
.gap-2 { gap: 0.5rem !important; }
.rounded { border-radius: 0.25rem !important; }
.flex.items-center {
  display: flex !important;
  align-items: center !important;
}`;

const PRINT_CSS = `
@media print {
${PRINT_LAYOUT_CSS}
${PRINT_RESPONSIVE_OVERRIDES_CSS}
${PRINT_SPACING_CSS}
${PRINT_DISCLOSURE_AND_COLOR_CSS}
${PRINT_TABLE_CSS}
${PRINT_FLEX_AND_TABLE_CONTAINER_CSS}
}`;

export function buildEvaluateResultPrintCss(isInIframe: boolean) {
  return `${!isInIframe ? FULL_PAGE_DIALOG_CSS : ''}${PRINT_CSS}`;
}
