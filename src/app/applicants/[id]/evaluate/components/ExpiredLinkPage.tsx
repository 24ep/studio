"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Home, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getJsonErrorMessage, getJsonString, readJsonObject } from '../../../../../lib/response-json';

interface ExpiredLinkPageProps {
  applicantId: string;
  applicantName?: string;
  appLogoUrl: string | null;
  canReactivate: boolean;
  evaluateHeaderBackgroundType: 'image' | 'gradient' | 'solid';
  evaluateHeaderBackgroundImage: string | null;
  evaluateHeaderBackgroundGradient: string | null;
  evaluateHeaderBackgroundColor: string;
  evaluateHeaderTextColor: string;
}

export function ExpiredLinkPage({
  applicantId,
  applicantName,
  appLogoUrl,
  canReactivate,
  evaluateHeaderBackgroundType,
  evaluateHeaderBackgroundImage,
  evaluateHeaderBackgroundGradient,
  evaluateHeaderBackgroundColor,
  evaluateHeaderTextColor,
}: ExpiredLinkPageProps) {
  const router = useRouter();
  const [reactivating, setReactivating] = useState(false);

  const getBackgroundStyle = () => {
    if (evaluateHeaderBackgroundType === 'image' && evaluateHeaderBackgroundImage) {
      return {
        backgroundImage: `url(${evaluateHeaderBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (evaluateHeaderBackgroundType === 'gradient' && evaluateHeaderBackgroundGradient) {
      return {
        background: evaluateHeaderBackgroundGradient,
      };
    }
    if (evaluateHeaderBackgroundType === 'solid') {
      return {
        background: `hsl(${evaluateHeaderBackgroundColor})`,
      };
    }
    return {
      background: `linear-gradient(135deg, hsl(179 67% 66%), hsl(238 74% 61%))`,
    };
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const response = await fetch(`/api/v1/applicants/${applicantId}/evaluation-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          days: 7,
          force: true,
        }),
      });

      if (response.ok) {
        const data = await readJsonObject(response);
        toast.success('Evaluation link reactivated successfully');
        const token = getJsonString(data, 'token');
        if (token) {
          window.location.href = `/applicants/${applicantId}/evaluate?token=${token}`;
        } else {
          window.location.reload();
        }
      } else {
        toast.error(getJsonErrorMessage(await readJsonObject(response), 'Failed to reactivate link'));
      }
    } catch (error) {
      console.error('Error reactivating link:', error);
      toast.error('Failed to reactivate link');
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={getBackgroundStyle()}>
      {/* Header */}
      <div className="py-8 flex items-center justify-between px-6 sm:px-10">
        <div>
          <div className="text-sm uppercase tracking-wide" style={{ color: `hsl(${evaluateHeaderTextColor})` }}>
            Evaluation Link
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight" style={{ color: `hsl(${evaluateHeaderTextColor})` }}>
            {applicantName || 'Applicant Evaluation'}
          </h1>
        </div>
        {appLogoUrl && (
          <div className="relative h-8 w-20 sm:h-10 sm:w-24">
            <Image
              src={appLogoUrl}
              alt="App Logo"
              fill
              unoptimized
              sizes="(max-width: 640px) 80px, 96px"
              className="object-contain"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-20">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Link Expired</h2>
            
            <p className="text-muted-foreground mb-8">
              This evaluation link has expired and is no longer valid. Please contact the administrator to get a new evaluation link.
            </p>

            <div className="space-y-3">
              {canReactivate && (
                <Button
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="w-full"
                  size="lg"
                >
                  {reactivating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Reactivate Link
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
                size="lg"
              >
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </div>

            {canReactivate && (
              <p className="text-xs text-muted-foreground mt-6">
                As an authorized user, you can reactivate this link for 7 more days.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
