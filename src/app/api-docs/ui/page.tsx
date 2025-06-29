'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsUIPage() {
  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI url="/api-docs" />
    </div>
  );
} 