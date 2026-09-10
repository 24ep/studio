import { useEffect, useState } from 'react';
import { sanitizeUrl } from '@/lib/utils';
import { getJsonString, readJsonObject } from '@/lib/response-json';

export function useApplicantQrLogo() {
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/settings/system-settings?keys=qrCodeLogo,appLogoDataUrl');
        const data = await readJsonObject(response);
        const qrCodeLogo = getJsonString(data, 'qrCodeLogo');
        const appLogoDataUrl = getJsonString(data, 'appLogoDataUrl');
        if (qrCodeLogo) {
          setAppLogoUrl(sanitizeUrl(qrCodeLogo));
        } else if (appLogoDataUrl) {
          setAppLogoUrl(sanitizeUrl(appLogoDataUrl));
        }
      } catch (error) {
        console.error('Failed to fetch QR code logo', error);
      }
    };

    void fetchLogo();
  }, []);

  return appLogoUrl;
}
