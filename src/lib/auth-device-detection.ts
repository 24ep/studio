export interface DetectedDevice {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  browser: string;
}

function detectDeviceType(userAgent: string): DetectedDevice['type'] {
  if (!userAgent) return 'unknown';
  if (/ipad|tablet|kindle|silk|playbook/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function detectOs(userAgent: string) {
  if (/windows phone/i.test(userAgent)) return 'Windows Phone';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  if (/android/i.test(userAgent)) return 'Android';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/cros/i.test(userAgent)) return 'ChromeOS';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Unknown';
}

function detectBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return 'Edge';
  if (/opr\//i.test(userAgent)) return 'Opera';
  if (/samsungbrowser\//i.test(userAgent)) return 'Samsung Internet';
  if (/firefox\//i.test(userAgent) || /fxios\//i.test(userAgent)) return 'Firefox';
  if (/chrome\//i.test(userAgent) || /crios\//i.test(userAgent)) return 'Chrome';
  if (/safari\//i.test(userAgent)) return 'Safari';
  return 'Unknown';
}

export function detectDevice(userAgent: string): DetectedDevice {
  return {
    type: detectDeviceType(userAgent),
    os: detectOs(userAgent),
    browser: detectBrowser(userAgent),
  };
}

export function serializeDevice(device: DetectedDevice) {
  return JSON.stringify(device);
}

export function describeDevice(deviceInfo?: string | null) {
  if (!deviceInfo) return null;

  try {
    const device = JSON.parse(deviceInfo) as Partial<DetectedDevice>;
    if (device.type && device.os && device.browser) {
      return `${device.browser} on ${device.os} (${device.type})`;
    }
  } catch {
    // Preserve compatibility with legacy "mobile" and "web" values.
  }

  return deviceInfo;
}

export function isDeviceChange(previousDeviceInfo?: string | null, nextDeviceInfo?: string | null) {
  if (!previousDeviceInfo || !nextDeviceInfo) return false;
  return previousDeviceInfo !== nextDeviceInfo;
}
