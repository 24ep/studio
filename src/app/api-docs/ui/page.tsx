'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsUIPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSwaggerSpec = async () => {
      try {
        const response = await fetch('/api-docs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const spec = await response.json();
        setSwaggerSpec(spec);
      } catch (err) {
        console.error('Failed to fetch Swagger spec:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
      }
    };

    fetchSwaggerSpec();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h2>API Documentation Error</h2>
        <p>Failed to load API documentation: {error}</p>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  if (!swaggerSpec) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h2>Loading API Documentation...</h2>
        <p>Please wait while we load the API documentation.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI 
        spec={swaggerSpec}
        docExpansion="list"
        defaultModelsExpandDepth={2}
        defaultModelExpandDepth={2}
        tryItOutEnabled={true}
        requestInterceptor={(request) => {
          // Add any request interceptors if needed
          return request;
        }}
        responseInterceptor={(response) => {
          // Add any response interceptors if needed
          return response;
        }}
      />
    </div>
  );
} 