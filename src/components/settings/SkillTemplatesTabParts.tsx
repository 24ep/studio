"use client";

import {
  AlertCircle,
  Brain,
  CheckCircle,
  Edit,
  FileText,
  Heart,
  MoreVertical,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SkillTemplate } from "./skill-templates-utils";

export function SkillTemplatesTabHeader({
  createButton,
}: {
  createButton: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">Skill Templates</h3>
        <p className="text-sm text-muted-foreground">
          Create and manage skill templates for evaluation
        </p>
      </div>
      <div className="flex gap-2">{createButton}</div>
    </div>
  );
}

export function SkillTemplatesGrid({
  templates,
  onOpenDetails,
  onOpenEdit,
  onDelete,
}: {
  templates: SkillTemplate[];
  onOpenDetails: (template: SkillTemplate) => void;
  onOpenEdit: (template: SkillTemplate) => void;
  onDelete: (templateId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-transparent hover:bg-transparent"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpenDetails(template)}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenEdit(template)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Template
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(template.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <SkillTemplateStats template={template} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SkillTemplateStats({ template }: { template: SkillTemplate }) {
  return (
    <div className="space-y-2">
      <SkillTemplateStat icon={<Users className="h-4 w-4 text-muted-foreground" />}>
        {template.templateGroups.length} expertise groups
      </SkillTemplateStat>
      <SkillTemplateStat icon={<Brain className="h-4 w-4 text-muted-foreground" />}>
        {template.templateSkills.length} expertise skills
      </SkillTemplateStat>
      <SkillTemplateStat icon={<Heart className="h-4 w-4 text-muted-foreground" />}>
        {template.templatePersonalityGroups?.length || 0} personality groups
      </SkillTemplateStat>
      <SkillTemplateStat icon={<Heart className="h-4 w-4 text-muted-foreground" />}>
        {template.templatePersonalityTraits?.length || 0} personality traits
      </SkillTemplateStat>
      <div className="flex items-center gap-2">
        {template.isActive ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">Active</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-600">Inactive</span>
          </>
        )}
      </div>
    </div>
  );
}

function SkillTemplateStat({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  );
}

export function SkillTemplatesEmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="text-center py-8">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Templates Created</h3>
      <p className="text-muted-foreground mb-4">
        Create your first skill template to get started
      </p>
      <Button onClick={onCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Create Template
      </Button>
    </div>
  );
}
