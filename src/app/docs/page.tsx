'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SwaggerUI to prevent build-time loading
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div>Loading API documentation...</div>
});

export default function ApiDocsPage() {
  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI 
        url="/api-docs"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        tryItOutEnabled={true}
      />
    </div>
  );
} 