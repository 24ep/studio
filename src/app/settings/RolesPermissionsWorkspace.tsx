"use client";

import { ExternalLink, ShieldCheck, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RolesPermissionsWorkspace() {
  return <div className="flex h-full min-h-0 flex-col bg-background p-6"><div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"><div className="border-b border-border/70 p-6"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span><div><h1 className="text-xl font-semibold tracking-tight text-foreground">Roles & Permissions</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Organization roles, member assignments, and organization permissions are authoritative in Outborn Account. Hrive keeps only product-specific HR data and compatibility permissions that are not Account organization controls.</p></div></div></div><div className="grid gap-4 p-6 md:grid-cols-2"><AuthorityCard icon={ShieldCheck} title="Roles & permissions" description="Create custom roles, manage Admin/Member defaults, and delegate organization permissions in one central authority." href="/api/outborn/account-admin?section=roles" action="Manage roles" /><AuthorityCard icon={UsersRound} title="Member assignments" description="Assign organization roles and manage membership status from the Account member directory." href="/api/outborn/account-admin?section=members" action="Manage members" /></div></div></div>;
}
function AuthorityCard({ icon: Icon, title, description, href, action }: { icon: typeof ShieldCheck; title: string; description: string; href: string; action: string }) {
  return <div className="rounded-xl border border-border/70 p-5"><Icon className="h-5 w-5 text-primary" /><h2 className="mt-4 text-sm font-semibold text-foreground">{title}</h2><p className="mt-1 min-h-16 text-sm leading-6 text-muted-foreground">{description}</p><Button asChild className="mt-4" size="sm" variant="outline"><a href={href}>{action} <ExternalLink className="ml-2 h-4 w-4" /></a></Button></div>;
}
