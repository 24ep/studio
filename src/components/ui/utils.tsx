import * as React from "react";

export function logIfInvalidSingleChild(child: React.ReactNode, triggerName: string) {
  if (!React.isValidElement(child)) {
    // eslint-disable-next-line no-console
    console.error(`[GlobalCheck] Invalid child for ${triggerName}:`, child);
  }
} 