"use client";

import { Briefcase, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface AzureAdPositionUser {
  id: string;
  displayName?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  mail?: string | null;
}

interface PositionMicrosoftAdTabProps {
  isMobile: boolean;
  positionTitle: string;
  users: AzureAdPositionUser[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function PositionMicrosoftAdTab({
  isMobile,
  positionTitle,
  users,
  isLoading,
  error,
  onRetry,
}: PositionMicrosoftAdTabProps) {
  return (
    <div className="flex-1 overflow-hidden bg-muted/5">
      <ScrollArea className="h-full">
        <div className={cn(isMobile ? "p-4 pb-48" : "p-6")}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Existing employees
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Active employees currently assigned to the {positionTitle} position
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center p-12 border rounded-lg bg-background">
              <p className="text-destructive mb-2">Error loading data</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-lg bg-background">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h4 className="text-base font-medium">No matching employees found</h4>
              <p className="text-sm text-muted-foreground mt-1">
                No active employees are currently assigned to this position.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg uppercase">
                        {user.displayName?.charAt(0) || "?"}
                      </div>
                    </div>
                    <CardTitle className="text-base mt-2 line-clamp-1" title={user.displayName || undefined}>
                      {user.displayName}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1" title={user.jobTitle || undefined}>
                      {user.jobTitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 text-sm space-y-2">
                    {user.department && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span className="truncate">{user.department}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-3.5 w-3.5 flex items-center justify-center text-[10px] font-bold border rounded-sm border-current">@</span>
                      <span className="truncate" title={user.mail || undefined}>{user.mail || "No email"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
