// src/app/api-docs/page.tsx
"use client";
import dynamic from "next/dynamic";
import React from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-background p-0">
      <SwaggerUI url="/api-docs" docExpansion="list" defaultModelsExpandDepth={-1} />
    </div>
  );
}
