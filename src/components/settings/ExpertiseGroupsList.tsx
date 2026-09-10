"use client";

import { AlertCircle, Edit, Plus, Trash2, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { ExpertiseGroup, ExpertiseSkill } from "./ExpertiseGroupsTabTypes";

interface ExpertiseGroupsListProps {
  groups: ExpertiseGroup[];
  skills: ExpertiseSkill[];
  onAddSkill: (group: ExpertiseGroup) => void;
  onEditGroup: (group: ExpertiseGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onRemoveSkill: (skillId: string) => void;
}

export function ExpertiseGroupsList({
  groups,
  skills,
  onAddSkill,
  onEditGroup,
  onDeleteGroup,
  onRemoveSkill,
}: ExpertiseGroupsListProps) {
  if (groups.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No expertise groups found. Create your first group to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <ExpertiseGroupCard
          key={group.id}
          group={group}
          skills={skills.filter(skill => skill.groupId === group.id)}
          onAddSkill={onAddSkill}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onRemoveSkill={onRemoveSkill}
        />
      ))}
    </div>
  );
}

interface ExpertiseGroupCardProps {
  group: ExpertiseGroup;
  skills: ExpertiseSkill[];
  onAddSkill: (group: ExpertiseGroup) => void;
  onEditGroup: (group: ExpertiseGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onRemoveSkill: (skillId: string) => void;
}

function ExpertiseGroupCard({
  group,
  skills,
  onAddSkill,
  onEditGroup,
  onDeleteGroup,
  onRemoveSkill,
}: ExpertiseGroupCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <div>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              {group.description && (
                <CardDescription>{group.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={group.isActive ? "default" : "secondary"}>
              {group.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => onAddSkill(group)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Skill
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEditGroup(group)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDeleteGroup(group.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills in this group</p>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Skills in this group:</h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="outline" className="flex items-center gap-1">
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(skill.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
