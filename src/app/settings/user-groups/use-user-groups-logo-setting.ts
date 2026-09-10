"use client";

import { useEffect, useState } from 'react';

import { fetchShowLogoOnlySetting } from './user-groups-page-api';

export function useUserGroupsLogoSetting(sessionStatus: string) {
  const [showLogoOnly, setShowLogoOnly] = useState(false);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') {
      return;
    }

    const loadShowLogoOnly = async () => {
      try {
        const nextShowLogoOnly = await fetchShowLogoOnlySetting();
        if (nextShowLogoOnly !== null) {
          setShowLogoOnly(nextShowLogoOnly);
        }
      } catch (error) {
        console.error('Error fetching showLogoOnly setting:', error);
      }
    };

    void loadShowLogoOnly();
  }, [sessionStatus]);

  return showLogoOnly;
}
