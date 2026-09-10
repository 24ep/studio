"use client";

import { useState, useEffect } from 'react';
import { RecruiterSyncCard } from '@/components/settings/RecruiterSyncCard';
import { readJsonObject } from '@/lib/response-json';

export default function RecruiterSyncPage() {
  const [showLogoOnly, setShowLogoOnly] = useState<boolean>(false);

  // Fetch showLogoOnly setting
  useEffect(() => {
    const fetchShowLogoOnly = async () => {
      try {
        const response = await fetch('/api/settings/system-settings?keys=showLogoOnly');
        if (response.ok) {
          const data = await readJsonObject(response);
          setShowLogoOnly(data.showLogoOnly === 'true' || data.showLogoOnly === true);
        }
      } catch (error) {
        console.error('Error fetching showLogoOnly setting:', error);
      }
    };
    fetchShowLogoOnly();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        {!showLogoOnly && (
          <h1 className="text-3xl font-bold tracking-tight">Recruiter Assignment Sync</h1>
        )}
        <p className="text-muted-foreground">
          Manage automatic synchronization of recruiter assignments between positions and Applicants.
        </p>
      </div>

      <RecruiterSyncCard />
    </div>
  );
}
