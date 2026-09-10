// src/lib/apiServers.ts
export function getApiServers() {
  const url = process.env.PRODUCTION_HOST || process.env.API_BASE_URL || 'http://8021_hri_app:8021';
  return [
    {
      url,
      description: url,
    },
  ];
} 
