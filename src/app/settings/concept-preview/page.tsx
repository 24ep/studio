"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BellRing,
  Building2,
  ChevronRight,
  CircleAlert,
  FileClock,
  KeyRound,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";

const categories = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "people", label: "People & access", icon: UsersRound },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "experience", label: "Experience", icon: Palette },
  { id: "security", label: "Security & data", icon: ShieldCheck },
] as const;

type CategoryId = (typeof categories)[number]["id"];

const settings: Record<CategoryId, Array<{ title: string; detail: string; href: string; status?: string }>> = {
  organization: [
    { title: "Company information", detail: "Legal details, contact information, and company identity", href: "/settings?adminTab=hr-setup&config=company-info", status: "Complete" },
    { title: "Departments & teams", detail: "Reporting structure and organizational groups", href: "/settings?adminTab=hr-setup&config=departments" },
    { title: "Branches & locations", detail: "Offices, regions, and working locations", href: "/settings?adminTab=hr-setup&config=branches" },
    { title: "Cost centers & projects", detail: "Financial ownership and project allocation", href: "/settings?adminTab=hr-setup" },
  ],
  people: [
    { title: "User accounts", detail: "Invite, activate, and manage employee access", href: "/settings?adminTab=users", status: "3 requests" },
    { title: "Roles & permissions", detail: "Control what people can view and change", href: "/settings?adminTab=roles" },
    { title: "Onboarding defaults", detail: "New-hire account and profile setup", href: "/settings?adminTab=hr-setup&config=onboarding" },
  ],
  workflows: [
    { title: "Approval routes", detail: "Payroll, leave, and employee-change approvals", href: "/settings?adminTab=system", status: "1 issue" },
    { title: "Document templates", detail: "Reusable letters, forms, and agreements", href: "/settings/document-templates" },
    { title: "Notifications", detail: "Email rules and employee reminders", href: "/settings?adminTab=communication" },
  ],
  experience: [
    { title: "Branding", detail: "Logo, colors, and portal appearance", href: "/settings?adminTab=branding" },
    { title: "Employee portal", detail: "Navigation, modules, and self-service options", href: "/settings?adminTab=system" },
    { title: "Fields & forms", detail: "Custom data fields and form layouts", href: "/settings?adminTab=field-management" },
  ],
  security: [
    { title: "Authentication", detail: "Sign-in rules, SSO, and multi-factor authentication", href: "/settings?adminTab=security", status: "Recommended" },
    { title: "Privacy & retention", detail: "Data access, consent, and retention rules", href: "/settings?adminTab=security" },
    { title: "Audit log", detail: "Review important administrative changes", href: "/settings?adminTab=logs" },
  ],
};

const pinned = [
  { icon: Building2, title: "Company information", detail: "Organization profile", href: "/settings?adminTab=hr-setup&config=company-info" },
  { icon: UsersRound, title: "Roles & permissions", detail: "Access control", href: "/settings?adminTab=roles" },
  { icon: Palette, title: "Branding", detail: "Portal appearance", href: "/settings?adminTab=branding" },
  { icon: KeyRound, title: "Authentication", detail: "Sign-in security", href: "/settings?adminTab=security" },
];

export default function AdminConceptPreviewPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("organization");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleSettings = normalizedQuery
    ? Object.values(settings).flat().filter(item => `${item.title} ${item.detail}`.toLowerCase().includes(normalizedQuery))
    : settings[activeCategory];

  return (
    <main className="admin-existing min-h-full bg-[#f5f6f3] text-[#232721] dark:bg-[#0e1210] dark:text-[#edf1eb]">
      <style jsx global>{`
        .admin-existing { font-family: "DM Sans", sans-serif; }
        @keyframes admin-enter { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .admin-existing .admin-enter { animation: admin-enter .45s cubic-bezier(.22,1,.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .admin-existing .admin-enter { animation: none } }
      `}</style>

      <div className="border-b border-[#daddd6] bg-[#fbfcf9] px-4 py-4 dark:border-[#283029] dark:bg-[#141915] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8e6ff] text-[#5147a7] dark:bg-[#302c4d] dark:text-[#c9c4ff]"><Building2 className="h-4 w-4" /></span><div><h1 className="text-base font-bold tracking-[-.015em]">Admin Center</h1><p className="mt-0.5 text-xs text-[#6f756d] dark:text-[#9ea69d]">Organization settings, access, and platform readiness</p></div></div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#d4d8d1] bg-[#f5f6f3] px-3 md:w-72 dark:border-[#303931] dark:bg-[#1b211c]"><Search className="h-3.5 w-3.5 text-[#747b73]" /><input value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#8a9088]" placeholder="Find a setting…" /></label>
            <Link href="/settings/overview" className="hidden h-9 items-center rounded-lg border border-[#d4d8d1] px-3 text-xs font-bold hover:bg-[#eff1ec] dark:border-[#303931] dark:hover:bg-[#202721] sm:inline-flex">Current view</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="admin-enter grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(380px,.88fr)]">
          <div className="overflow-hidden rounded-2xl border border-[#d6dad3] bg-[#fbfcf9] dark:border-[#293129] dark:bg-[#151a16]">
            <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#70776f] dark:text-[#9ca49b]">Setup health</p><h2 className="mt-2 text-lg font-bold tracking-[-.025em]">12 of 14 essentials complete</h2><p className="mt-1 text-xs text-[#747a72] dark:text-[#9fa79e]">Your core HR foundation is ready. Two safeguards remain.</p></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e1eee7] text-sm font-bold text-[#28694d] dark:bg-[#223a2e] dark:text-[#9bd1b5]">86</span></div>
            <div className="mx-5 h-2 overflow-hidden rounded-full bg-[#e4e7e1] dark:bg-[#29312a] sm:mx-6"><div className="h-full w-[86%] rounded-full bg-[#39775a] dark:bg-[#78b894]" /></div>
            <div className="mt-5 grid border-t border-[#dfe2dc] sm:grid-cols-2 dark:border-[#293129]">
              <ActionRow icon={ShieldCheck} title="Strengthen sign-in security" detail="Enable multi-factor authentication" href="/settings?adminTab=security" />
              <ActionRow icon={Workflow} title="Repair approval route" detail="Assign one backup approver" href="/settings?adminTab=system" second />
            </div>
          </div>

          <div className="rounded-2xl border border-[#d6dad3] bg-[#fbfcf9] p-5 dark:border-[#293129] dark:bg-[#151a16] sm:p-6">
            <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#70776f] dark:text-[#9ca49b]">Today</p><h2 className="mt-2 text-lg font-bold tracking-[-.025em]">Three items need attention</h2></div><BellRing className="h-5 w-5 text-[#5d51b8] dark:text-[#aaa3ff]" /></div>
            <div className="mt-4 divide-y divide-[#e1e3de] border-y border-[#e1e3de] dark:divide-[#2d352e] dark:border-[#2d352e]">
              <AttentionRow icon={UsersRound} title="3 access requests" note="People Ops · today" />
              <AttentionRow icon={CircleAlert} title="Payroll approval route" note="Missing backup approver" warning />
              <AttentionRow icon={FileClock} title="18 acknowledgments" note="Policy reminder due Friday" />
            </div>
            <button className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#5147a7] dark:text-[#aaa3ff]">Review priority queue <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#747a72] dark:text-[#9ca49b]">Quick access</p><h2 className="mt-1 text-sm font-bold">Pinned settings</h2></div><button className="text-[11px] font-bold text-[#666d65] hover:text-[#5147a7] dark:text-[#a8afa6]">Edit pins</button></div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-[#d6dad3] bg-[#d6dad3] dark:border-[#293129] dark:bg-[#293129] sm:grid-cols-2 xl:grid-cols-4">
            {pinned.map(({ icon: Icon, title, detail, href }) => <Link key={title} href={href} className="group flex min-h-[88px] items-center gap-3 bg-[#fbfcf9] p-4 transition hover:bg-[#f0f1ec] dark:bg-[#151a16] dark:hover:bg-[#1d231e]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eeedf8] text-[#5a50a5] dark:bg-[#2b2940] dark:text-[#b8b2f3]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{title}</strong><span className="mt-1 block text-[10px] text-[#777d75] dark:text-[#969e95]">{detail}</span></span><ChevronRight className="h-3.5 w-3.5 text-[#9a9f98] transition-transform group-hover:translate-x-0.5" /></Link>)}
          </div>
        </section>

        <section className="mt-7 pb-10">
          <div className="mb-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#747a72] dark:text-[#9ca49b]">Configuration</p><h2 className="mt-1 text-sm font-bold">All settings</h2></div>
          <div className="grid overflow-hidden rounded-2xl border border-[#d6dad3] bg-[#fbfcf9] dark:border-[#293129] dark:bg-[#151a16] lg:grid-cols-[250px_minmax(0,1fr)]">
            <nav className="border-b border-[#dfe2dc] p-2 dark:border-[#293129] lg:border-b-0 lg:border-r">
              {categories.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setActiveCategory(id); setQuery(""); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs font-semibold transition ${activeCategory === id && !normalizedQuery ? "bg-[#e9e7fa] text-[#4d439e] dark:bg-[#2b2943] dark:text-[#c7c1ff]" : "text-[#596058] hover:bg-[#f0f2ed] dark:text-[#b3bab1] dark:hover:bg-[#1e251f]"}`}><Icon className="h-4 w-4" />{label}{activeCategory === id && !normalizedQuery && <ChevronRight className="ml-auto h-3.5 w-3.5" />}</button>)}
              <div className="mx-3 mt-3 border-t border-[#e0e3dd] pt-4 dark:border-[#2d352e]"><button className="flex items-center gap-2 text-[10px] font-bold text-[#554ca0] dark:text-[#aaa3ff]"><Sparkles className="h-3.5 w-3.5" />Ask admin assistant</button><p className="mt-1.5 text-[9px] leading-4 text-[#858b83]">Get help finding or configuring a setting.</p></div>
            </nav>
            <div>
              <div className="flex min-h-[58px] items-center justify-between border-b border-[#dfe2dc] px-5 dark:border-[#293129]"><div><strong className="text-xs">{normalizedQuery ? "Search results" : categories.find(category => category.id === activeCategory)?.label}</strong><p className="mt-0.5 text-[9px] text-[#81877f]">{visibleSettings.length} settings available</p></div>{!normalizedQuery && <span className="rounded-full bg-[#e5efe9] px-2.5 py-1 text-[9px] font-bold text-[#326d52] dark:bg-[#22372c] dark:text-[#9acbb1]">Ready</span>}</div>
              <div className="divide-y divide-[#e1e4de] dark:divide-[#2b332c]">
                {visibleSettings.map(item => <Link href={item.href} key={item.title} className="group grid min-h-[70px] grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 transition hover:bg-[#f1f3ee] dark:hover:bg-[#1c231d]"><span><strong className="block text-xs">{item.title}</strong><span className="mt-1 block text-[10px] leading-4 text-[#767d74] dark:text-[#969e95]">{item.detail}</span></span>{item.status && <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${item.status === "1 issue" ? "bg-[#faead5] text-[#925616] dark:bg-[#49341f] dark:text-[#efbb78]" : "bg-[#edf0eb] text-[#667066] dark:bg-[#283029] dark:text-[#aeb7ad]"}`}>{item.status}</span>}<ChevronRight className="h-3.5 w-3.5 text-[#9ba099] transition-transform group-hover:translate-x-0.5" /></Link>)}
                {!visibleSettings.length && <div className="grid min-h-52 place-items-center p-8 text-center"><div><Search className="mx-auto h-5 w-5 text-[#969c94]" /><p className="mt-3 text-xs font-bold">No matching settings</p><button onClick={() => setQuery("")} className="mt-2 text-[10px] font-bold text-[#5147a7] dark:text-[#aaa3ff]">Clear search</button></div></div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ActionRow({ icon: Icon, title, detail, href, second = false }: { icon: typeof ShieldCheck; title: string; detail: string; href: string; second?: boolean }) {
  return <Link href={href} className={`group flex items-center gap-3 px-5 py-4 transition hover:bg-[#f0f2ed] dark:hover:bg-[#1d231e] sm:px-6 ${second ? "border-t border-[#dfe2dc] dark:border-[#293129] sm:border-l sm:border-t-0" : ""}`}><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eeedf8] text-[#5b51a8] dark:bg-[#2b2940] dark:text-[#bbb5f5]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[11px]">{title}</strong><span className="mt-1 block truncate text-[9px] text-[#777e75] dark:text-[#969e95]">{detail}</span></span><ChevronRight className="h-3.5 w-3.5 text-[#9ba099] transition-transform group-hover:translate-x-0.5" /></Link>;
}

function AttentionRow({ icon: Icon, title, note, warning = false }: { icon: typeof UsersRound; title: string; note: string; warning?: boolean }) {
  return <button className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 py-3 text-left"><span className={`grid h-7 w-7 place-items-center rounded-full ${warning ? "bg-[#faead5] text-[#a15f17] dark:bg-[#49341f] dark:text-[#efbb78]" : "bg-[#eeedf8] text-[#5a50a6] dark:bg-[#2b2940] dark:text-[#bbb5f5]"}`}><Icon className="h-3.5 w-3.5" /></span><span><strong className="block text-[11px]">{title}</strong><span className="mt-0.5 block text-[9px] text-[#7b8179] dark:text-[#969e95]">{note}</span></span><ChevronRight className="h-3.5 w-3.5 text-[#9ba099] transition-transform group-hover:translate-x-0.5" /></button>;
}
