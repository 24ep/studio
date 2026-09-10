"use client";

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }

  return count.toString();
}

export function FitScoreSmoothCount({ count }: { count: number }) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (prevCountRef.current === count) {
      return;
    }

    setIsTransitioning(true);

    const startCount = prevCountRef.current;
    const endCount = count;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.round(startCount + (endCount - startCount) * easeOut);

      setDisplayCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsTransitioning(false);
      }
    };

    requestAnimationFrame(animate);
    prevCountRef.current = count;
  }, [count]);

  return (
    <span className={cn(
      'transition-all duration-300',
      isTransitioning && 'text-blue-600 font-semibold',
    )}>
      {formatCount(displayCount)}
    </span>
  );
}
