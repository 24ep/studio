"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateFullApplicantDetailApplicant } from "../full-applicant-detail-api";
import type { Applicant } from "@/lib/types";
import {
  composeApplicantInfoFullName,
  getApplicantInfoFieldValue,
  getApplicantPersonalInfo,
} from "./applicant-info-tab-utils";

type ApplicantEditableField = "title" | "name" | "nickname" | "email" | "phone" | "location" | "about";

interface ApplicantInfoForm {
  title: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone: string;
  location: string;
  about: string;
}

interface ApplicantInfoDisplayCardProps {
  applicant: Applicant;
  editable?: boolean;
  editRequestKey?: number;
  onApplicantChange?: (applicant: Applicant) => void;
  onRefresh?: () => void;
}

function applicantInfoForm(applicant: Applicant): ApplicantInfoForm {
  const personalInfo = getApplicantPersonalInfo(applicant.parsedData);
  return {
    title: getApplicantInfoFieldValue(personalInfo?.title_honorific),
    firstName: getApplicantInfoFieldValue(personalInfo?.firstname),
    lastName: getApplicantInfoFieldValue(personalInfo?.lastname),
    nickname: getApplicantInfoFieldValue(personalInfo?.nickname),
    email: applicant.email || "",
    phone: applicant.phone || "",
    location: getApplicantInfoFieldValue(personalInfo?.location),
    about: getApplicantInfoFieldValue(personalInfo?.introduction_aboutme),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function ApplicantInfoDisplayCard({
  applicant,
  editable = false,
  editRequestKey = 0,
  onApplicantChange,
  onRefresh,
}: ApplicantInfoDisplayCardProps) {
  const [editingField, setEditingField] = useState<ApplicantEditableField | null>(null);
  const [form, setForm] = useState<ApplicantInfoForm>(() => applicantInfoForm(applicant));
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setEditingField(null);
    setEditError(null);
    setForm(applicantInfoForm(applicant));
  }, [applicant.id]);

  useEffect(() => {
    if (editRequestKey > 0) {
      setEditingField(null);
      setEditError(null);
    }
  }, [editRequestKey]);

  const startEditing = (field: ApplicantEditableField) => {
    setForm(applicantInfoForm(applicant));
    setEditError(null);
    setEditingField(field);
  };

  const saveField = async () => {
    if (!editingField || isSaving) return;

    if (editingField === "name" && (!form.firstName.trim() || !form.lastName.trim())) {
      setEditError("First name and last name are required.");
      return;
    }
    if (editingField === "email" && !form.email.trim()) {
      setEditError("Email is required.");
      return;
    }

    const parsedData = asRecord(applicant.parsedData);
    const personalInfo = { ...asRecord(parsedData.personal_info) };
    const contactInfo = { ...asRecord(parsedData.contact_info) };
    const payload: Record<string, unknown> = {};

    if (editingField === "title") personalInfo.title_honorific = form.title.trim();
    if (editingField === "name") {
      personalInfo.firstname = form.firstName.trim();
      personalInfo.lastname = form.lastName.trim();
    }
    if (editingField === "nickname") personalInfo.nickname = form.nickname.trim();
    if (editingField === "location") personalInfo.location = form.location.trim();
    if (editingField === "about") personalInfo.introduction_aboutme = form.about.trim();
    if (editingField === "email") {
      payload.email = form.email.trim();
      contactInfo.email = form.email.trim();
    }
    if (editingField === "phone") {
      payload.phone = form.phone.trim() || null;
      contactInfo.phone = form.phone.trim();
    }

    const nextParsedData = { ...parsedData, personal_info: personalInfo, contact_info: contactInfo };
    payload.parsedData = nextParsedData;
    if (editingField === "name" || editingField === "title") {
      payload.name = composeApplicantInfoFullName(
        personalInfo.title_honorific,
        personalInfo.firstname,
        personalInfo.lastname,
      ) || applicant.name;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await updateFullApplicantDetailApplicant(applicant.id, payload);
      onApplicantChange?.({
        ...applicant,
        ...(payload.name !== undefined ? { name: String(payload.name) } : {}),
        ...(payload.email !== undefined ? { email: String(payload.email) } : {}),
        ...(editingField === "phone" ? { phone: form.phone.trim() || null } : {}),
        parsedData: nextParsedData as Applicant["parsedData"],
      });
      setEditingField(null);
      onRefresh?.();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Unable to update this attribute.");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditError(null);
    setForm(applicantInfoForm(applicant));
  };

  const personalInfo = getApplicantPersonalInfo(applicant.parsedData);
  const fullName = composeApplicantInfoFullName(
    personalInfo?.title_honorific,
    personalInfo?.firstname,
    personalInfo?.lastname,
  ) || applicant.name;

  const field = (name: ApplicantEditableField, label: string, value: string, editor: ReactNode, wide = false) => (
    <ApplicantInfoValue
      key={name}
      label={label}
      value={value}
      editor={editor}
      wide={wide}
      canEdit={editable}
      isEditing={editingField === name}
      isSaving={isSaving && editingField === name}
      error={editingField === name ? editError : null}
      onEdit={() => startEditing(name)}
      onCancel={cancelEditing}
      onSave={() => void saveField()}
    />
  );

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Applicant details</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {editable ? "Edit and save one attribute at a time without leaving the profile." : "Identity and personal information from the applicant profile."}
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <ApplicantInfoSection title="Personal profile" description="Core identity details used throughout Recruitment.">
          {field("title", "Title", getApplicantInfoFieldValue(personalInfo?.title_honorific), <Input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />)}
          {field("name", "Name", fullName, <div className="grid gap-2 sm:grid-cols-2"><Input aria-label="First name" placeholder="First name" value={form.firstName} onChange={event => setForm(current => ({ ...current, firstName: event.target.value }))} /><Input aria-label="Last name" placeholder="Last name" value={form.lastName} onChange={event => setForm(current => ({ ...current, lastName: event.target.value }))} /></div>)}
          {field("nickname", "Nickname", getApplicantInfoFieldValue(personalInfo?.nickname), <Input value={form.nickname} onChange={event => setForm(current => ({ ...current, nickname: event.target.value }))} />)}
          {field("email", "Email", applicant.email, <Input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} />)}
          {field("phone", "Phone", applicant.phone || "", <Input type="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} />)}
          {field("location", "Location", getApplicantInfoFieldValue(personalInfo?.location), <Input value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} />)}
        </ApplicantInfoSection>
        <ApplicantInfoSection title="Introduction" description="The applicant's profile summary and personal introduction.">
          {field("about", "About", getApplicantInfoFieldValue(personalInfo?.introduction_aboutme), <Textarea rows={4} value={form.about} onChange={event => setForm(current => ({ ...current, about: event.target.value }))} />, true)}
        </ApplicantInfoSection>
      </div>
    </section>
  );
}

function ApplicantInfoSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="grid border-b border-border last:border-b-0 lg:grid-cols-[minmax(150px,190px)_minmax(0,1fr)]">
      <div className="bg-muted/25 px-4 py-5 lg:border-r lg:border-border lg:px-5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-x-8 px-4 py-1 sm:grid-cols-2 lg:px-6">{children}</div>
    </div>
  );
}

function ApplicantInfoValue({
  label, value, editor, wide, canEdit, isEditing, isSaving, error, onEdit, onCancel, onSave,
}: {
  label: string;
  value: string;
  editor: ReactNode;
  wide?: boolean;
  canEdit: boolean;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className={`border-b border-border/70 py-3.5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 ${wide ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {isEditing ? (
        <div className="mt-2 rounded-lg border border-primary/25 bg-primary/[0.03] p-2.5">
          {editor}
          {error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}
          <div className="mt-2.5 flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" disabled={isSaving} onClick={onCancel}>Cancel</Button>
            <Button type="button" size="sm" disabled={isSaving} onClick={onSave}>{isSaving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      ) : (
        <div className="group mt-1 flex min-h-9 items-start justify-between gap-3 rounded-md border border-transparent py-1 transition-colors hover:bg-muted/30">
          <p className="min-w-0 break-words text-sm font-medium leading-6 text-foreground">{value || "Not provided"}</p>
          {canEdit ? (
            <Button type="button" size="sm" variant="ghost" className="-my-1 h-8 shrink-0 px-2 text-xs text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100" onClick={onEdit} aria-label={`Edit ${label}`}>
              <PencilSquareIcon className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
