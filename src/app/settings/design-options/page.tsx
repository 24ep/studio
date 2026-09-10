"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  KeyRound,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";

type ConceptId = "brief" | "control" | "guided";

const concepts: Array<{ id: ConceptId; number: string; name: string; promise: string; bestFor: string; tone: string }> = [
  { id: "brief", number: "01", name: "Morning Brief", promise: "Decisions before configuration", bestFor: "Everyday HR administrators", tone: "Calm · Editorial · Human" },
  { id: "control", number: "02", name: "Control Desk", promise: "Everything important at a glance", bestFor: "Experienced operations teams", tone: "Dense · Precise · Fast" },
  { id: "guided", number: "03", name: "Guided Setup", promise: "A clear path to readiness", bestFor: "Growing and onboarding teams", tone: "Supportive · Visual · Progressive" },
];

export default function AdminDesignOptionsPage() {
  const [selected, setSelected] = useState<ConceptId>("brief");
  const [confirmed, setConfirmed] = useState(false);
  const active = concepts.find(concept => concept.id === selected)!;

  const select = (id: ConceptId) => {
    setSelected(id);
    setConfirmed(false);
  };

  return (
    <main className="min-h-full bg-[#f3f1eb] text-[#20231f] dark:bg-[#111411] dark:text-[#edf0ea]">
      <style jsx global>{`
        .admin-options { font-family: "DM Sans", sans-serif; }
        .admin-options .editorial { font-family: "DM Sans", sans-serif; }
        @keyframes option-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .admin-options .option-in { animation: option-in .42s cubic-bezier(.22,1,.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .admin-options .option-in { animation: none } }
      `}</style>
      <div className="admin-options">
        <header className="border-b border-[#d8d6ce] bg-[#f9f8f4] px-5 py-5 dark:border-[#30352f] dark:bg-[#171b17] lg:px-10">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#696e66] dark:text-[#aab0a8]">Admin Center · Design study</p>
              <h1 className="editorial mt-1 text-2xl tracking-[-.035em] sm:text-3xl">Choose the way your team works.</h1>
            </div>
            <Link href="/settings/overview" className="hidden text-xs font-bold text-[#555a53] underline-offset-4 hover:underline dark:text-[#c5cac2] sm:block">Current Admin Center</Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1500px] gap-7 px-5 py-7 lg:grid-cols-[310px_minmax(0,1fr)] lg:px-10 lg:py-10">
          <aside>
            <p className="mb-3 text-xs leading-5 text-[#6a7068] dark:text-[#a7ada5]">Select a direction to compare its layout, personality, and focus.</p>
            <div className="border-y border-[#cecec6] dark:border-[#343a34]">
              {concepts.map(concept => {
                const isActive = selected === concept.id;
                return (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => select(concept.id)}
                    aria-pressed={isActive}
                    className={`group grid w-full grid-cols-[30px_1fr_auto] gap-3 border-b border-[#d8d7d0] px-1 py-5 text-left transition last:border-b-0 dark:border-[#303630] ${isActive ? "text-[#493fb0] dark:text-[#aaa3ff]" : "hover:bg-[#eae8e1] dark:hover:bg-[#1a1f1a]"}`}
                  >
                    <span className="pt-0.5 text-[10px] font-bold tracking-[.12em] opacity-60">{concept.number}</span>
                    <span><strong className="block text-sm">{concept.name}</strong><span className="mt-1.5 block text-xs leading-5 text-[#747970] dark:text-[#a0a69e]">{concept.promise}</span></span>
                    <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border ${isActive ? "border-[#574bd0] bg-[#574bd0] text-white dark:border-[#9f97ff] dark:bg-[#9f97ff] dark:text-[#211b50]" : "border-[#aaa9a2]"}`}>{isActive && <Check className="h-3 w-3" />}</span>
                  </button>
                );
              })}
            </div>

            <dl className="mt-6 grid gap-4 text-xs">
              <div><dt className="font-bold text-[#363a35] dark:text-[#dce0da]">Best for</dt><dd className="mt-1 text-[#73786f] dark:text-[#9fa69d]">{active.bestFor}</dd></div>
              <div><dt className="font-bold text-[#363a35] dark:text-[#dce0da]">Personality</dt><dd className="mt-1 text-[#73786f] dark:text-[#9fa69d]">{active.tone}</dd></div>
            </dl>

            <button onClick={() => setConfirmed(true)} className="mt-7 flex w-full items-center justify-between rounded-full bg-[#242721] px-5 py-3 text-xs font-bold text-[#f5f5ef] transition hover:-translate-y-0.5 hover:bg-[#4540a2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#746bd8] dark:bg-[#e7ebe3] dark:text-[#20231f] dark:hover:bg-[#afa8ff]">
              {confirmed ? `${active.name} selected` : "Select this direction"}
              {confirmed ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
            {confirmed && <p className="mt-3 text-center text-[11px] text-[#327256] dark:text-[#8dceb0]">Choice saved for this review session.</p>}
          </aside>

          <section aria-live="polite" className="min-w-0">
            <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#777c74] dark:text-[#a2a9a0]">Interactive preview</span><span className="rounded-full border border-[#cecec6] px-2.5 py-1 text-[10px] dark:border-[#394039]">Desktop · Light first</span></div>
            <div className="overflow-hidden rounded-[26px] border border-[#cbc9c1] bg-[#faf9f5] shadow-[0_24px_70px_rgba(39,42,36,.10)] dark:border-[#343a34] dark:bg-[#171b17] dark:shadow-none">
              <div className="flex h-11 items-center gap-2 border-b border-[#deddd6] bg-[#efede7] px-4 dark:border-[#303630] dark:bg-[#202520]"><i className="h-2.5 w-2.5 rounded-full bg-[#d97970]" /><i className="h-2.5 w-2.5 rounded-full bg-[#d7ad5d]" /><i className="h-2.5 w-2.5 rounded-full bg-[#6aaf7e]" /><span className="ml-3 text-[10px] font-semibold text-[#858980]">hrive / Admin Center</span></div>
              <div key={selected} className="option-in min-h-[640px]">{selected === "brief" ? <MorningBrief /> : selected === "control" ? <ControlDesk /> : <GuidedSetup />}</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function MorningBrief() {
  return <div className="bg-[#f9f8f4] p-5 text-[#22251f] dark:bg-[#171b17] dark:text-[#edf0ea] sm:p-8">
    <div className="flex items-start justify-between gap-6 border-b border-[#d8d7d0] pb-7 dark:border-[#343a34]"><div><p className="flex items-center gap-2 text-[10px] font-bold text-[#697068]"><i className="h-1.5 w-1.5 rounded-full bg-[#31815f]" />Everything is running normally</p><h2 className="editorial mt-3 text-[clamp(2rem,5vw,4rem)] leading-none tracking-[-.055em]">Good morning, Maya.</h2><p className="mt-3 text-xs text-[#6c7169] dark:text-[#a9afa7]">Three items need a decision today.</p></div><Search className="mt-1 h-5 w-5 text-[#747a72]" /></div>
    <div className="grid gap-4 pt-5 xl:grid-cols-[1.5fr_.72fr]"><div className="overflow-hidden rounded-[20px] bg-[#252821] text-[#f0f2eb]"><div className="px-6 py-5"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#aeb4aa]">Needs attention</p><h3 className="editorial mt-2 text-2xl">Three decisions, about 8 minutes</h3></div>{["3 access requests", "Payroll approval route", "18 policy acknowledgments"].map((item, index) => <div key={item} className="flex items-center gap-3 border-t border-[#3c4038] px-6 py-4"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#3f433a] text-[10px]">0{index + 1}</span><span className="flex-1 text-xs font-bold">{item}</span><ChevronRight className="h-3.5 w-3.5" /></div>)}</div><div className="rounded-[20px] bg-[#e3dfc8] p-6 text-[#292b23] dark:bg-[#393c32] dark:text-[#eef0e7]"><ShieldCheck className="h-5 w-5 text-[#47705d]" /><p className="mt-8 text-[9px] font-bold uppercase tracking-[.14em]">Organization readiness</p><strong className="editorial mt-2 block text-5xl">86%</strong><div className="mt-4 h-1.5 rounded-full bg-[#c4bea4]"><div className="h-full w-[86%] rounded-full bg-[#47705d]" /></div><p className="mt-4 text-[10px] leading-4 opacity-70">Two safeguards will move you to Strong.</p></div></div>
    <PreviewNav />
  </div>;
}

function ControlDesk() {
  const rows = [["User provisioning", "Operational", "12 ms"], ["Payroll approvals", "Attention", "1 route"], ["Authentication", "Operational", "8 ms"], ["Document queue", "Operational", "0 waiting"]];
  return <div className="bg-[#eef1ec] p-5 text-[#1f2922] dark:bg-[#151b17] dark:text-[#edf2ed] sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#52705e]">Operations workspace</p><h2 className="mt-1 text-2xl font-bold tracking-[-.04em]">Admin Control Desk</h2></div><div className="flex gap-2"><span className="rounded-md border border-[#ccd4cc] bg-[#f8faf7] px-3 py-2 text-[10px] dark:border-[#354139] dark:bg-[#202923]">Production</span><span className="rounded-md bg-[#215e43] px-3 py-2 text-[10px] font-bold text-[#eff8f1]">All systems normal</span></div></div>
    <div className="mt-6 grid gap-px overflow-hidden rounded-xl bg-[#cad1ca] dark:bg-[#344037] sm:grid-cols-4">{[["Approvals", "03"], ["Setup", "86%"], ["Active admins", "24"], ["Risk alerts", "01"]].map(([label, value]) => <div key={label} className="bg-[#fafbf8] p-4 dark:bg-[#202822]"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#778078]">{label}</p><strong className="mt-3 block text-2xl tracking-[-.04em]">{value}</strong></div>)}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_.7fr]"><div className="overflow-hidden rounded-xl border border-[#ccd4cc] bg-[#fafbf8] dark:border-[#344037] dark:bg-[#202822]"><div className="flex items-center justify-between border-b border-[#d8ded8] p-4 dark:border-[#344037]"><strong className="text-xs">Service and workflow status</strong><span className="text-[9px] text-[#798279]">Live · 30s</span></div>{rows.map(([name, status, value]) => <div key={name} className="grid grid-cols-[1fr_auto_55px] items-center gap-3 border-b border-[#e0e4df] px-4 py-3 text-[10px] last:border-b-0 dark:border-[#323c35]"><strong>{name}</strong><span className={status === "Attention" ? "text-[#a95e13]" : "text-[#2a7651]"}>● {status}</span><span className="text-right text-[#777f78]">{value}</span></div>)}</div><div className="rounded-xl bg-[#26342b] p-5 text-[#edf5ef]"><CircleAlert className="h-4 w-4 text-[#e4b466]" /><p className="mt-5 text-[9px] font-bold uppercase tracking-[.14em] text-[#aebbb1]">Next action</p><h3 className="mt-2 text-lg font-bold">Repair payroll route</h3><p className="mt-2 text-[10px] leading-4 text-[#b9c5bc]">Finance approval has no backup approver.</p><button className="mt-6 flex w-full justify-between border-t border-[#47564b] pt-3 text-[10px] font-bold">Open route <ArrowRight className="h-3 w-3" /></button></div></div>
    <PreviewNav />
  </div>;
}

function GuidedSetup() {
  const steps = [{ label: "Organization profile", done: true }, { label: "People structure", done: true }, { label: "Access & security", done: false }, { label: "Workflows & policies", done: false }];
  return <div className="bg-[#faf7f0] p-5 text-[#29251f] dark:bg-[#191815] dark:text-[#f3eee5] sm:p-8">
    <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]"><div><span className="inline-flex rounded-full bg-[#e5ddff] px-3 py-1 text-[9px] font-bold uppercase tracking-[.14em] text-[#5949a3] dark:bg-[#393153] dark:text-[#d2c8ff]">Setup journey</span><h2 className="editorial mt-5 text-[clamp(2rem,4.5vw,3.6rem)] leading-[.98] tracking-[-.05em]">Build your HR foundation with confidence.</h2><p className="mt-4 max-w-sm text-xs leading-5 text-[#756e64] dark:text-[#aaa399]">We’ll guide you through the decisions that unlock reliable workflows for your team.</p><div className="mt-7 flex items-center gap-3"><div className="relative grid h-14 w-14 place-items-center rounded-full bg-[#e2ddcf] text-sm font-bold dark:bg-[#353229]">52%</div><div><strong className="text-xs">Foundation in progress</strong><p className="mt-1 text-[10px] text-[#777066]">2 of 4 stages ready</p></div></div></div>
    <div className="overflow-hidden rounded-[22px] border border-[#ded7ca] bg-[#fffdf8] dark:border-[#3b3831] dark:bg-[#23211c]"><div className="border-b border-[#e3ddd2] p-5 dark:border-[#3b3831]"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#81786d]">Your setup path</p></div>{steps.map((step, index) => <div key={step.label} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-[#e6e0d6] px-5 py-4 last:border-b-0 dark:border-[#3a3730]"><span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${step.done ? "bg-[#376c55] text-white" : index === 2 ? "bg-[#5c4db6] text-white" : "bg-[#e5e0d6] text-[#777066] dark:bg-[#39362f]"}`}>{step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span><strong className="block text-xs">{step.label}</strong><small className="mt-1 block text-[9px] text-[#80786e]">{step.done ? "Complete" : index === 2 ? "Recommended next · 12 min" : "Available after stage 3"}</small></span>{index === 2 && <button className="rounded-full bg-[#29261f] px-3 py-2 text-[9px] font-bold text-[#fffaf1] dark:bg-[#eee8dc] dark:text-[#28241e]">Continue</button>}</div>)}</div></div>
    <div className="mt-6 rounded-xl bg-[#ece3c8] px-4 py-3 text-[10px] text-[#5e543f] dark:bg-[#373225] dark:text-[#d7ccb4]"><Sparkles className="mr-2 inline h-3.5 w-3.5" />Admin assistant can prefill your security defaults from current policies.</div>
  </div>;
}

function PreviewNav() {
  const items = [{ icon: Building2, label: "Organization" }, { icon: UsersRound, label: "People & access" }, { icon: Workflow, label: "Workflows" }, { icon: KeyRound, label: "Security" }];
  return <div className="mt-7 grid border-y border-[#d8d7d0] dark:border-[#343a34] sm:grid-cols-4">{items.map(({ icon: Icon, label }, index) => <div key={label} className={`flex items-center justify-between gap-3 px-3 py-4 text-[10px] font-bold ${index > 0 ? "border-t border-[#d8d7d0] dark:border-[#343a34] sm:border-l sm:border-t-0" : ""}`}><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-[#5a50b1] dark:text-[#aaa3ff]" />{label}</span><ChevronRight className="h-3 w-3 opacity-40" /></div>)}</div>;
}
