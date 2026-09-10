"use client";

import * as React from "react";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AutoFont } from "./auto-font";
import { RealtimeIndicator } from "./realtime-indicator";
import { useLivePageDetection } from "@/hooks/use-live-page-detection";
import { useEnhancedSSE } from "@/hooks/use-enhanced-sse";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const { isLivePage } = useLivePageDetection();

  // Get real-time connection status for live pages
  const { isConnected, error, reconnect } = useEnhancedSSE();

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        if (isLast) {
          return (
            <span
              key={index}
              className="flex items-center text-foreground font-medium"
            >
              {Icon && <Icon className="mr-1 h-4 w-4" />}
              <AutoFont>{item.label}</AutoFont>
              {isLivePage && (
                <RealtimeIndicator
                  isConnected={isConnected}
                  isReconnecting={!!error}
                  reconnectAttempts={0}
                  size="sm"
                  showText={false}
                  className="ml-2"
                />
              )}
            </span>
          );
        }

        return (
          <React.Fragment key={index}>
            {item.href ? (
              <Link
                href={item.href}
                className="flex items-center hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="mr-1 h-4 w-4" />}
                <AutoFont>{item.label}</AutoFont>
              </Link>
            ) : (
              <span className="flex items-center">
                {Icon && <Icon className="mr-1 h-4 w-4" />}
                <AutoFont>{item.label}</AutoFont>
              </span>
            )}
            <ChevronRightIcon className="h-4 w-4" />
          </React.Fragment>
        );
      })}
    </nav>
  );
} 