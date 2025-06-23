"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, XCircle, CheckCircle, FileText, RotateCcw, ExternalLink, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import { CandidateImportUploadQueue, useCandidateQueue } from "@/components/candidates/CandidateImportUploadQueue";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function MultiCandidateUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addJob } = useCandidateQueue();

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (
        file.type === "application/pdf" &&
        file.size <= 10 * 1024 * 1024
      ) {
        addJob({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          type: "upload",
          status: "queued"
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Bulk Upload Candidate CVs</h1>
      <div className="mb-6">
        <Input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFilesSelected}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-2">PDF only, up to 10MB each. You can select multiple files.</p>
      </div>
      <CandidateImportUploadQueue />
    </div>
  );
} 