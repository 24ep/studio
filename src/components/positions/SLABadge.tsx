"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { getSLABadgeVariant } from '@/lib/slaUtils.client';
import type { SLACheckResult } from '@/lib/slaUtils.client';
import type { Position } from '@/lib/types';
import { getJsonNumber, getJsonString, readJsonObject } from '../../lib/response-json';

interface SLABadgeProps {
  position: Position;
  className?: string;
}

export function SLABadge({ position, className }: SLABadgeProps) {
  const [slaResult, setSlaResult] = useState<SLACheckResult | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateSLA = async () => {
      if (!position.isOpen || !position.grade?.slaDays || !position.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/positions/${position.id}/sla`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await readJsonObject(response);
        const errorMessage = getJsonString(data, 'error');

        // Handle cases where SLA calculation is not possible
        if (errorMessage) {
          console.warn('SLA calculation not possible:', errorMessage);
          setSlaResult(null);
          setRemaining(null);
        } else {
          setSlaResult(data.violation && typeof data.violation === 'object'
            ? data.violation as unknown as SLACheckResult
            : null);
          setRemaining(getJsonNumber(data, 'remainingDays') ?? null);
        }
      } catch (error) {
        console.error('Error calculating SLA:', error);
        setSlaResult(null);
        setRemaining(null);
      } finally {
        setLoading(false);
      }
    };

    calculateSLA();
  }, [position]);

  if (loading) {
    return (
      <div className={`ml-2 text-[10px] px-1.5 py-0.5 flex items-center gap-1 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  if (slaResult && slaResult.isViolated) {
    const variant = getSLABadgeVariant(slaResult.daysOverdue);
    return (
      <Badge variant={variant} className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${className}`}>
        SLA overdue {slaResult.daysOverdue}d
      </Badge>
    );
  }

  if (remaining !== null && remaining <= 3 && remaining > 0) {
    return (
      <Badge variant="warning" className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${className}`}>
        SLA due in {remaining}d
      </Badge>
    );
  }

  return null;
}
