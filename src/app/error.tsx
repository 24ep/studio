'use client'

import { useEffect } from 'react'
import { isChunkLoadError, recoverFromChunkLoadError } from '@/lib/chunk-load-recovery'
import { isServiceUnavailableError } from '@/lib/service-unavailable-utils'
import { ServiceUnavailableState } from '@/components/ui/ServiceUnavailableState'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console
    console.error('Error boundary caught error', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    })

    if (isChunkLoadError(error)) {
      recoverFromChunkLoadError(error).catch((recoveryError) => {
        console.error('Chunk load recovery failed:', recoveryError)
      })
    }
  }, [error])

  if (isServiceUnavailableError(error)) {
    return <ServiceUnavailableState onRetry={reset} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          Something went wrong!
        </h2>
        <p className="mb-6 text-muted-foreground">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button type="button"
          onClick={() => {
            if (isChunkLoadError(error)) {
              recoverFromChunkLoadError(error).catch(() => window.location.reload())
              return
            }

            reset()
          }}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
