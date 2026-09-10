import { ArrowRight, Banknote, FileCheck2, Landmark, ReceiptText } from "lucide-react";

const steps = [
  {
    icon: FileCheck2,
    title: "Finalize & generate",
    description: "Studio freezes the approved run and prepares controlled payment outputs.",
  },
  {
    icon: Landmark,
    title: "Settle externally",
    description: "An authorized operator uploads or sends the payment file through the bank/payment rail.",
  },
  {
    icon: ReceiptText,
    title: "Record confirmation",
    description: "Return to Studio with the bank/payment reference and settlement evidence.",
  },
  {
    icon: Banknote,
    title: "Reconcile & close",
    description: "Reconcile internal payroll totals, resolve differences, then close the run.",
  },
];

export function PayrollSettlementBoundary() {
  return (
    <section
      aria-label="Payroll payment settlement boundary"
      className="border-b border-blue-200 bg-blue-50/80 px-4 py-4 sm:px-6 lg:px-8 dark:border-blue-950 dark:bg-blue-950/20"
    >
      <div className="mb-3 flex items-start gap-3">
        <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            Payment boundary: Studio prepares and controls payroll; the bank moves the money.
          </p>
          <p className="mt-0.5 max-w-[100ch] text-xs leading-5 text-slate-600 dark:text-slate-300">
            A run is not treated as paid until an authorized operator records the external settlement reference and evidence. This keeps payment initiation, confirmation, reconciliation, and audit evidence explicit.
          </p>
        </div>
      </div>
      <ol className="grid gap-2 md:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="relative rounded-md border border-blue-100 bg-white/80 p-3 dark:border-blue-950 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  {index + 1}
                </span>
                <Icon className="h-4 w-4 text-blue-700 dark:text-blue-300" aria-hidden="true" />
                <p className="text-xs font-semibold">{step.title}</p>
              </div>
              <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-blue-400 md:block" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
