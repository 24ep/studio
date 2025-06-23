// src/app/api-docs/page.tsx
"use client";
import dynamic from "next/dynamic";
import swaggerSpec from "@/swagger";
import type { FC } from "react";
// @ts-ignore
import type { SwaggerUIProps } from "swagger-ui-react";

const SwaggerUI = dynamic<SwaggerUIProps>(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

const ApiDocsSwaggerPage: FC = () => {
  return (
    <div style={{ background: "#fff", padding: 24, borderRadius: 8, minHeight: 600 }}>
      <SwaggerUI spec={swaggerSpec} />
    </div>
  );
};

export default ApiDocsSwaggerPage;
