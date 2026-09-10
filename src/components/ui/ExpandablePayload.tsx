'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Expand, Minimize2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExpandablePayloadProps {
  data: unknown;
  title?: string;
  className?: string;
  maxHeight?: string;
  showCopyButton?: boolean;
  compact?: boolean;
}

export function ExpandablePayload({
  data,
  title = "Payload",
  className = "",
  maxHeight = "max-h-40",
  showCopyButton = true,
  compact = false
}: ExpandablePayloadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { show: showToast } = useToast();

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      showToast("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast("Failed to copy");
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleMinimize = () => {
    setIsExpanded(false);
  };

  return (
    <>
      <div className={`space-y-2 w-full max-w-full ${className}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium truncate">{title}</h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            {showCopyButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpand}
              className="h-6 w-6 p-0"
            >
              <Expand className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className={`relative w-full ${compact ? 'text-xs' : 'text-sm'}`}>
          <div className="w-full max-w-full overflow-hidden">
            <pre className={`p-3 bg-muted rounded-md overflow-auto ${maxHeight} border whitespace-pre-wrap break-words w-full`}>
              {jsonString}
            </pre>
          </div>
        </div>
      </div>

      {/* Full-screen dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <div className="flex items-center gap-2">
                {showCopyButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMinimize}
                  className="flex items-center gap-2"
                >
                  <Minimize2 className="h-4 w-4" />
                  Minimize
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="px-6 pb-6">
            <ScrollArea className="h-[70vh] w-full">
              <pre className="p-4 bg-muted rounded-md text-sm overflow-auto border whitespace-pre-wrap break-words max-w-full">
                {jsonString}
              </pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ExpandablePayload;
