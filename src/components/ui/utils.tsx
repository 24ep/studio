import * as React from "react";
import { logger } from "@/lib/logger";

export function logIfInvalidSingleChild(child: React.ReactNode, triggerName: string) {
  if (!React.isValidElement(child)) {
    logger.error(`[GlobalCheck] Invalid child for ${triggerName}:`, child);
  }
} 
