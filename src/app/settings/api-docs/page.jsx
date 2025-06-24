// src/app/api-docs/page.tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";
const ApiDocsSwaggerPage = () => {
    const [spec, setSpec] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetch("/api-docs")
            .then((res) => {
            if (!res.ok)
                throw new Error("Failed to fetch Swagger spec");
            return res.json();
        })
            .then((data) => {
            setSpec(data);
            setLoading(false);
        })
            .catch((err) => {
            setError(err.message);
            setLoading(false);
        });
    }, []);
    if (loading)
        return <div>Loading API documentation...</div>;
    if (error)
        return <div>Error loading API documentation: {error}</div>;
    return (<div style={{ background: "#fff", padding: 24, borderRadius: 8, minHeight: 600 }}>
      <SwaggerUI spec={spec}/>
    </div>);
};
export default ApiDocsSwaggerPage;
