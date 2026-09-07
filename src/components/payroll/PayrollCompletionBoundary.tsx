import { CheckCircle2, Landmark, Scale, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Landmark,
    title: "Paid",
    description: "External settlement reference and evidence are recorded.",
  },
  {
    icon: Scale,
    title: "Reconciled",
    description: "Payment, payslip, and accounting totals agree within policy.",
  },
  {
    icon: ShieldCheck,
    title: "Closed",
    description: "Control checks are complete and the payroll run is closed.",
  },
] as const;

export function PayrollCompletionBoundary() {
  return (
    <section
      aria-label="Payroll operational completion boundary"
      className="border-b border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-800 dark:bg-[#07111f] dark:text-slate-100 sm:px-6"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Operational completion
          </div>
          <p className="mt-1 text-sm font-semibold">Paid is not the finish line.</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
            A payroll run is complete only after settlement is reconciled and the
            run reaches Closed. This keeps payment confirmation separate from
            financial-control completion.
          </p>
        </div>

        <ol className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3 xl:max-w-3xl">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li
              key={title}
              className="flex min-w-0 items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold">
                  {index + 1}. {title}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
