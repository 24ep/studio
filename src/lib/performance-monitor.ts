import React, { useCallback, useRef } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  memoryUsage: number;
  apiCallCount: number;
  slowQueries: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  public startMonitoring(_intervalMs: number = 30000): void {
    return;
  }

  public stopMonitoring(): void {
    return;
  }

  public getMetrics(): Map<string, PerformanceMetrics> {
    return this.metrics;
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function useAsyncLoopPrevention(operationName: string) {
  const lastExecutionTime = useRef(0);
  const executionCount = useRef(0);

  const canExecute = useCallback(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionTime.current;

    if (timeSinceLastExecution > 1000) {
      lastExecutionTime.current = now;
      executionCount.current = 0;
      return true;
    }

    executionCount.current++;

    if (executionCount.current > 10) {
      console.warn(`Too many ${operationName} executions detected`);
      return false;
    }

    return true;
  }, [operationName]);

  const reset = useCallback(() => {
    lastExecutionTime.current = 0;
    executionCount.current = 0;
  }, []);

  return { canExecute, reset };
}

export class MemoryLeakDetector {
  private componentRefs: Map<string, Set<WeakRef<object>>> = new Map();
  private cleanupIntervals: Map<string, NodeJS.Timeout> = new Map();

  trackComponent(componentName: string, ref: object): void {
    if (!this.componentRefs.has(componentName)) {
      this.componentRefs.set(componentName, new Set());
    }

    const refs = this.componentRefs.get(componentName)!;
    refs.add(new WeakRef(ref));

    if (!this.cleanupIntervals.has(componentName)) {
      const interval = setInterval(() => {
        this.cleanupDeadRefs(componentName);
      }, 60000);

      this.cleanupIntervals.set(componentName, interval);
    }
  }

  private cleanupDeadRefs(componentName: string): void {
    const refs = this.componentRefs.get(componentName);
    if (!refs) return;

    const deadRefs: WeakRef<object>[] = [];
    for (const ref of refs) {
      if (!ref.deref()) {
        deadRefs.push(ref);
      }
    }

    deadRefs.forEach(ref => refs.delete(ref));

    if (refs.size === 0) {
      const interval = this.cleanupIntervals.get(componentName);
      if (interval) {
        clearInterval(interval);
        this.cleanupIntervals.delete(componentName);
      }
    }
  }

  getComponentCount(componentName: string): number {
    const refs = this.componentRefs.get(componentName);
    if (!refs) return 0;

    let count = 0;
    for (const ref of refs) {
      if (ref.deref()) count++;
    }
    return count;
  }

  cleanup(): void {
    for (const interval of this.cleanupIntervals.values()) {
      clearInterval(interval);
    }
    this.cleanupIntervals.clear();
    this.componentRefs.clear();
  }
}

export const memoryLeakDetector = new MemoryLeakDetector();

export function useMemoryLeakTracking(componentName: string) {
  const componentRef = React.useRef<object | null>(null);

  React.useEffect(() => {
    if (componentRef.current) {
      memoryLeakDetector.trackComponent(componentName, componentRef.current);
    }
  }, [componentName]);

  return componentRef;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryLeakDetector.cleanup();
  });
}
