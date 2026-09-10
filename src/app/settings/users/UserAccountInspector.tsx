"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  Loader2,
  MapPin,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserAvatarCompact } from "@/components/ui/user-avatar";
import type { UnifiedUserFormValues } from "@/components/users/UnifiedUserModal";
import { buildUnifiedUserEditDefaults } from "@/components/users/unified-user-modal/unified-user-modal-utils";
import { cn } from "@/lib/utils";
import type { UserProfile, UserTeam } from "@/lib/types";
import { sendUsersPageMfaSetupLink } from "./users-page-api";
import { getUserAccountStatus, getUserRoleBadgeLabel } from "./users-page-utils";

type InspectorTab = "access" | "security" | "activity" | "danger";

interface UserAccountInspectorProps {
  user: UserProfile | null;
  roles: Array<{ id: string; name: string }>;
  teams: UserTeam[];
  canEditUsers: boolean;
  onSave: (userId: string, data: UnifiedUserFormValues) => Promise<void>;
  onToggleStatus: (user: UserProfile) => void;
  onClose: () => void;
}

const tabItems: Array<{ id: InspectorTab; label: string }> = [
  { id: "access", label: "Access" },
  { id: "security", label: "Security" },
  { id: "activity", label: "Activity" },
  { id: "danger", label: "Danger" },
];

export function UserAccountInspector({ user, roles, teams, canEditUsers, onSave, onToggleStatus, onClose }: UserAccountInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("access");
  const [draft, setDraft] = useState<UnifiedUserFormValues | null>(() => buildDraft(user));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isSendingMfaLink, setIsSendingMfaLink] = useState(false);

  const status = useMemo(() => user ? getUserAccountStatus(user) : null, [user]);
  const initialDraft = useMemo(() => buildDraft(user), [user]);

  useEffect(() => {
    setActiveTab("access");
    setDraft(initialDraft);
    setTouched({});
    setIsPasswordResetOpen(false);
  }, [initialDraft, user?.id]);

  useEffect(() => {
    if (!user) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, user]);

  if (!user || !status || !draft || !initialDraft) return null;

  const isActive = status === "active";
  const roleLabel = getUserRoleBadgeLabel(user);
  const groups = user.teams?.length ? user.teams.map(team => team.name) : ["All employees"];
  const nameError = !draft.name.trim() ? "Name is required" : "";
  const emailError = !/^\S+@\S+\.\S+$/.test(draft.email.trim()) ? "Enter a valid email address" : "";
  const passwordError = isPasswordResetOpen && !draft.newPassword
    ? "Enter a temporary password"
    : draft.newPassword && draft.newPassword.length < 8
      ? "Password must be at least 8 characters"
      : "";
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);
  const updateDraft = <K extends keyof UnifiedUserFormValues>(field: K, value: UnifiedUserFormValues[K]) => {
    setDraft(current => current ? { ...current, [field]: value } : current);
  };
  const saveChanges = async () => {
    setTouched({ name: true, email: true, newPassword: true });
    if (nameError || emailError || passwordError || !canEditUsers || !isDirty) return;
    setIsSaving(true);
    try {
      await onSave(user.id, { ...draft, name: draft.name.trim(), email: draft.email.trim() });
    } finally {
      setIsSaving(false);
    }
  };
  const sendMfaSetupLink = async () => {
    setIsSendingMfaLink(true);
    try {
      const message = await sendUsersPageMfaSetupLink(user.id);
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send MFA setup link");
    } finally {
      setIsSendingMfaLink(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close account details"
        className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Account details for ${user.name}`}
        style={{ width: "min(440px, calc(100vw - 2rem))" }}
        className="fixed bottom-4 right-4 top-4 z-[100] flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-[-24px_0_80px_rgba(0,0,0,0.38)]"
      >
      <div className="shrink-0 border-b border-border p-5">
        <div className="flex items-start gap-3">
          <UserAvatarCompact user={user} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold">{user.name || "Unnamed user"}</h2>
              <Badge variant={isActive ? "default" : status === "disabled" ? "destructive" : "secondary"} className="h-5 text-[10px]">
                {status === "disabled" ? "Suspended" : status[0].toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {user.employeeId && <span>{user.employeeId}</span>}
              {user.department && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{user.department}</span>}
              {user.officeLocation && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{user.officeLocation}</span>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close account details">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 border-b border-border px-5" role="tablist" aria-label="Account detail sections">
        {tabItems.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative h-10 flex-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab.id === "danger" && "text-destructive/80 hover:text-destructive",
              activeTab === tab.id && tab.id !== "danger" && "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-primary",
              activeTab === "danger" && tab.id === "danger" && "text-destructive after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-destructive",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {activeTab === "access" && (
          <>
            <InspectorSection title="Account profile" description="Changes are saved directly to this account.">
              <div className="grid gap-3 sm:grid-cols-2">
                <InlineField label="Full name" error={touched.name ? nameError : ""}>
                  <Input
                    value={draft.name}
                    disabled={!canEditUsers || isSaving}
                    aria-invalid={Boolean(touched.name && nameError)}
                    onBlur={() => setTouched(current => ({ ...current, name: true }))}
                    onChange={event => updateDraft("name", event.target.value)}
                  />
                </InlineField>
                <InlineField label="Email address" error={touched.email ? emailError : ""}>
                  <Input
                    type="email"
                    value={draft.email}
                    disabled={!canEditUsers || isSaving}
                    aria-invalid={Boolean(touched.email && emailError)}
                    onBlur={() => setTouched(current => ({ ...current, email: true }))}
                    onChange={event => updateDraft("email", event.target.value)}
                  />
                </InlineField>
                <InlineField label="Job title">
                  <Input value={draft.positionTitle || ""} disabled={!canEditUsers || isSaving} onChange={event => updateDraft("positionTitle", event.target.value)} />
                </InlineField>
                <InlineField label="Department">
                  <Input value={draft.department || ""} disabled={!canEditUsers || isSaving} onChange={event => updateDraft("department", event.target.value)} />
                </InlineField>
                <InlineField label="Office location">
                  <Input value={draft.officeLocation || ""} disabled={!canEditUsers || isSaving} onChange={event => updateDraft("officeLocation", event.target.value)} />
                </InlineField>
                <InlineField label="Phone number">
                  <Input type="tel" value={draft.phoneNumber || ""} disabled={!canEditUsers || isSaving} onChange={event => updateDraft("phoneNumber", event.target.value)} />
                </InlineField>
              </div>
            </InspectorSection>

            <InspectorSection title="Assigned roles" description="Roles define what this account can access and do.">
              <InlineField label="Primary platform role">
                <Select value={draft.role || roleLabel} disabled={!canEditUsers || isSaving} onValueChange={value => updateDraft("role", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(role => <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </InlineField>
              <InlineField label="Primary team">
                <Select value={draft.userTeamIds?.[0] || "none"} disabled={!canEditUsers || isSaving} onValueChange={value => updateDraft("userTeamIds", value === "none" ? [] : [value])}>
                  <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team</SelectItem>
                    {teams.filter(team => team.isActive).map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </InlineField>
            </InspectorSection>

            <InspectorSection title="Group memberships" description="Groups inherited by this account.">
              <div className="flex flex-wrap gap-2">
                {groups.map(group => <Badge key={group} variant="outline" className="gap-1"><UsersRound className="h-3 w-3" />{group}</Badge>)}
              </div>
            </InspectorSection>

            <InspectorSection title="Access scope" description="The organization data available to this account.">
              <div className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{user.role === "Admin" ? "Global" : user.department || "Assigned teams"}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {user.role === "Admin" ? "Access to all organizations and locations." : "Access is limited by role and group membership."}
                </p>
              </div>
            </InspectorSection>
          </>
        )}

        {activeTab === "security" && (
          <>
            <InspectorSection title="Sign-in security" description="Authentication health for this account.">
              <DetailRow icon={ShieldCheck} label="Multi-factor authentication" value={user.twoFactorEnabled ? "Enabled" : "Not enabled"} good={Boolean(user.twoFactorEnabled)} />
              <DetailRow icon={LockKeyhole} label="Authentication" value={user.authenticationMethods?.join(", ") || "Password"} />
              <DetailRow icon={KeyRound} label="Password" value="Managed" />
            </InspectorSection>
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="justify-start"
                disabled={!canEditUsers || isSaving}
                onClick={() => {
                  if (isPasswordResetOpen) {
                    setIsPasswordResetOpen(false);
                    updateDraft("newPassword", initialDraft.newPassword || "");
                    updateDraft("forcePasswordChange", initialDraft.forcePasswordChange || false);
                  } else {
                    setIsPasswordResetOpen(true);
                    updateDraft("newPassword", "");
                    updateDraft("forcePasswordChange", true);
                  }
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" />Reset password
              </Button>
              {isPasswordResetOpen && (
                <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
                  <InlineField label="New temporary password" error={touched.newPassword ? passwordError : ""}>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={draft.newPassword || ""}
                      disabled={isSaving}
                      aria-invalid={Boolean(touched.newPassword && passwordError)}
                      onBlur={() => setTouched(current => ({ ...current, newPassword: true }))}
                      onChange={event => updateDraft("newPassword", event.target.value)}
                    />
                  </InlineField>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor="force-password-change" className="text-xs font-medium">Require change at next sign-in</Label>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">The temporary password can only be used to start the next session.</p>
                    </div>
                    <Switch
                      id="force-password-change"
                      checked={Boolean(draft.forcePasswordChange)}
                      disabled={isSaving}
                      onCheckedChange={value => updateDraft("forcePasswordChange", value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={saveChanges}
                    disabled={!draft.newPassword || Boolean(passwordError) || isSaving}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? "Updating password" : "Update password"}
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                className="justify-start"
                disabled={!canEditUsers || user.twoFactorEnabled || isSendingMfaLink}
                onClick={sendMfaSetupLink}
              >
                {isSendingMfaLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {user.twoFactorEnabled ? "MFA already enabled" : isSendingMfaLink ? "Sending setup link" : "Send MFA setup link"}
              </Button>
            </div>
          </>
        )}

        {activeTab === "activity" && (
          <InspectorSection title="Recent activity" description="Latest account and authentication events.">
            <ActivityItem icon={Activity} title="Signed in" detail={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "No sign-in recorded"} />
            <ActivityItem icon={CheckCircle2} title="Account profile reviewed" detail="Today" />
            <ActivityItem icon={Clock3} title="Account created" detail={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Date unavailable"} />
          </InspectorSection>
        )}

        {activeTab === "danger" && (
          <section className="space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4" aria-labelledby="account-status-heading">
            <div>
              <h3 id="account-status-heading" className="text-sm font-semibold text-destructive">
                {isActive ? "Suspend this account" : "Reactivate this account"}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isActive
                  ? "The user will be signed out and unable to access the platform until an administrator reactivates the account."
                  : "The user will regain access using their existing role, team, and authentication settings."}
              </p>
            </div>
            <Button
              className="w-full"
              variant={isActive ? "destructive" : "default"}
              onClick={() => onToggleStatus(user)}
              disabled={!canEditUsers || isSaving}
            >
              {isActive ? "Suspend account" : "Reactivate account"}
            </Button>
          </section>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-background p-4">
        <Button className="w-full" onClick={saveChanges} disabled={!canEditUsers || !isDirty || Boolean(nameError || emailError || passwordError) || isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? "Saving" : "Save changes"}
        </Button>
      </div>
      </aside>
    </>
  );
}

function InlineField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-destructive" role="alert">{error}</p>}
    </div>
  );
}

function buildDraft(user: UserProfile | null): UnifiedUserFormValues | null {
  if (!user) return null;
  const defaults = buildUnifiedUserEditDefaults(user);
  return {
    name: defaults.name || "",
    email: defaults.email || "",
    password: "",
    role: defaults.role || user.role,
    newPassword: "",
    forcePasswordChange: false,
    authenticationMethods: defaults.authenticationMethods || ["basic"],
    userTeamIds: defaults.userTeamIds || [],
    userGroupIds: defaults.userGroupIds || [],
    avatarUrl: defaults.avatarUrl || "",
    personalColor: defaults.personalColor || "#3B82F6",
    positionTitle: defaults.positionTitle || "",
    department: defaults.department || "",
    phoneNumber: defaults.phoneNumber || "",
    officeLocation: defaults.officeLocation || "",
  };
}

function InspectorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold">{title}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function DetailRow({ icon: Icon, label, value, good }: { icon: typeof ShieldCheck; label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/70 py-2.5 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium", good && "text-emerald-500")}>{value}</span>
    </div>
  );
}

function ActivityItem({ icon: Icon, title, detail }: { icon: typeof Activity; title: string; detail: string }) {
  return (
    <div className="flex gap-3 border-l border-border pl-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-primary" />
      <div><p className="text-xs font-medium">{title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p></div>
    </div>
  );
}
