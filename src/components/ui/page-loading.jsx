"use client";
import { Loader2 } from 'lucide-react';
export function PageLoading({ message = "Loading page...", className = "" }) {
    return (<div className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card border shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>);
}
