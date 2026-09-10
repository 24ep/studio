"use client";

import { InformationCircleIcon as Info } from "@heroicons/react/24/outline";

export function RecruitmentPipelineStyles() {
  return (
    <style jsx>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        margin: 4px 0;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #2563eb 0%, #1e40af 100%);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .custom-scrollbar::-webkit-scrollbar-thumb:active {
        background: linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%);
      }

      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #3b82f6 rgba(0, 0, 0, 0.05);
      }

      .dark .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }

      .dark .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
        border: 1px solid rgba(0, 0, 0, 0.2);
      }

      .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
      }

      .dark .custom-scrollbar {
        scrollbar-color: #60a5fa rgba(255, 255, 255, 0.05);
      }

      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `}</style>
  );
}

export function RecruitmentPipelineEmptyState() {
  return (
    <div className="text-center py-4 text-muted-foreground">
      <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">Loading recruitment stages...</p>
    </div>
  );
}

export function RecruitmentPipelineLine({ gradient }: { gradient: string }) {
  return (
    <div
      className="absolute top-4"
      style={{
        left: "16px",
        right: "16px",
        height: "3px",
        background: gradient,
        borderTop: "none",
        borderBottom: "none",
      }}
    />
  );
}
