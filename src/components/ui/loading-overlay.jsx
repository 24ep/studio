"use client";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
export function LoadingOverlay({ isLoading, text = 'Loading...', size = 'md', variant = 'overlay', className, children }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };
    const spinner = (<div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])}/>
      {text && (<p className="text-sm text-muted-foreground text-center max-w-xs">
          {text}
        </p>)}
    </div>);
    if (variant === 'inline') {
        return (<div className={cn('flex items-center justify-center p-4', className)}>
        {spinner}
      </div>);
    }
    if (variant === 'skeleton') {
        return (<div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-muted rounded mb-2"/>
        <div className="h-4 bg-muted rounded mb-2 w-3/4"/>
        <div className="h-4 bg-muted rounded w-1/2"/>
      </div>);
    }
    if (!isLoading) {
        return <>{children}</>;
    }
    return (<div className="relative">
      {children}
      <div className={cn('absolute inset-0 z-50 flex items-center justify-center', 'bg-background/80 backdrop-blur-sm', 'transition-opacity duration-200', className)} role="status" aria-live="polite" aria-label={text}>
        {spinner}
      </div>
    </div>);
}
// Skeleton components for different content types
export function SkeletonCard() {
    return (<div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 bg-muted rounded-md animate-pulse"/>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"/>
          <div className="h-3 bg-muted rounded w-1/2 animate-pulse"/>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse"/>
        <div className="h-4 bg-muted rounded w-5/6 animate-pulse"/>
        <div className="h-4 bg-muted rounded w-4/6 animate-pulse"/>
      </div>
    </div>);
}
export function SkeletonTable({ rows = 5 }) {
    return (<div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-4 bg-muted rounded animate-pulse flex-1"/>))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (<div key={i} className="flex space-x-4 p-4">
          {Array.from({ length: 4 }).map((_, j) => (<div key={j} className="h-4 bg-muted rounded animate-pulse flex-1"/>))}
        </div>))}
    </div>);
}
export function SkeletonList({ items = 3 }) {
    return (<div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (<div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
          <div className="h-10 w-10 bg-muted rounded-md animate-pulse"/>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"/>
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse"/>
          </div>
        </div>))}
    </div>);
}
// Page loading component
export function PageLoading({ text = 'Loading page...', size = 'lg' }) {
    return (<div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className={cn('animate-spin text-primary mx-auto', size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12')}/>
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>);
}
// Button loading state
export function LoadingButton(_a) {
    var { isLoading, children, loadingText = 'Loading...' } = _a, props = __rest(_a, ["isLoading", "children", "loadingText"]);
    return (<button {...props} disabled={isLoading || props.disabled} className={cn('inline-flex items-center justify-center', 'disabled:opacity-50 disabled:cursor-not-allowed', props.className)}>
      {isLoading && (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>)}
      {isLoading ? loadingText : children}
    </button>);
}
