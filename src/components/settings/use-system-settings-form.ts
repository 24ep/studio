"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type { SystemSetting } from "@/lib/types";

import { DEFAULT_SYSTEM_SETTING } from "./SystemSettingsFormTypes";

export function useSystemSettingsForm({
  setting,
  onSubmit,
}: {
  setting: SystemSetting | null;
  onSubmit: (data: SystemSetting[]) => void;
}) {
  const [formData, setFormData] = useState<SystemSetting>(DEFAULT_SYSTEM_SETTING);

  useEffect(() => {
    setFormData(setting || DEFAULT_SYSTEM_SETTING);
  }, [setting]);

  const handleInputChange = (field: keyof SystemSetting, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.key.trim()) {
      return;
    }

    const safeValue = formData.value === null || formData.value === undefined
      ? null
      : String(formData.value);

    onSubmit([{ ...formData, value: safeValue }]);
  };

  return {
    formData,
    handleInputChange,
    handleSubmit,
  };
}
