"use client";

import { cn } from '@/lib/utils';
import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithShimmerProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
    className?: string;
    shimmerClassName?: string;
}

export function ImageWithShimmer({
    className,
    shimmerClassName,
    alt,
    ...props
}: ImageWithShimmerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
        <div className="relative overflow-hidden">
            {/* Shimmer effect while loading */}
            {isLoading && !hasError && (
                <div
                    className={cn(
                        "absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted",
                        shimmerClassName
                    )}
                    style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite linear'
                    }}
                />
            )}

            {/* Actual image */}
            {!hasError ? (
                <Image
                    {...props}
                    alt={alt}
                    className={cn(
                        "transition-opacity duration-300",
                        isLoading ? "opacity-0" : "opacity-100",
                        className
                    )}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                />
            ) : (
                // Fallback when image fails to load
                <div
                    className={cn(
                        "flex items-center justify-center bg-muted text-muted-foreground text-xs",
                        className
                    )}
                >
                    {alt?.charAt(0)?.toUpperCase() || '?'}
                </div>
            )}

            <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
        </div>
    );
}
