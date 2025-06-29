// src/app/api-docs/page.tsx
"use client";
import React from "react";

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h2 className="text-2xl font-semibold text-foreground mb-2">API Documentation Disabled</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        The interactive API documentation (Swagger UI) is currently disabled to reduce build size and memory usage. If you need access, please contact the administrator or enable it in the codebase.
      </p>
    </div>
  );
}
