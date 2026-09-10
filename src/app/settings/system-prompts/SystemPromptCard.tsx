"use client";

import { Edit, FileText, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemPrompt } from "./types";

interface SystemPromptCardProps {
  onDeletePrompt: (id: string) => void;
  onEditPrompt: (prompt: SystemPrompt) => void;
  prompt: SystemPrompt;
}

export function SystemPromptCard({
  onDeletePrompt,
  onEditPrompt,
  prompt,
}: SystemPromptCardProps) {
  return (
    <Card className="ai-prompt-library-card group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {prompt.name}
            </CardTitle>
            <CardDescription className="mt-2">
              {prompt.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditPrompt(prompt)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeletePrompt(prompt.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={prompt.isActive ? "default" : "secondary"}>
              {prompt.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">{prompt.categoryName}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Updated: {new Date(prompt.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
