"use client";

import { AlertCircle, Edit, Plus, Trash2, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { PersonalityGroup, PersonalityTrait } from "./PersonalityGroupsTabTypes";

interface PersonalityGroupsListProps {
  groups: PersonalityGroup[];
  traits: PersonalityTrait[];
  onAddTrait: (group: PersonalityGroup) => void;
  onEditGroup: (group: PersonalityGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onRemoveTrait: (traitId: string) => void;
}

export function PersonalityGroupsList({
  groups,
  traits,
  onAddTrait,
  onEditGroup,
  onDeleteGroup,
  onRemoveTrait,
}: PersonalityGroupsListProps) {
  if (groups.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No personality groups found. Create your first group to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <PersonalityGroupCard
          key={group.id}
          group={group}
          traits={traits.filter(trait => trait.groupId === group.id)}
          onAddTrait={onAddTrait}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onRemoveTrait={onRemoveTrait}
        />
      ))}
    </div>
  );
}

interface PersonalityGroupCardProps {
  group: PersonalityGroup;
  traits: PersonalityTrait[];
  onAddTrait: (group: PersonalityGroup) => void;
  onEditGroup: (group: PersonalityGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onRemoveTrait: (traitId: string) => void;
}

function PersonalityGroupCard({
  group,
  traits,
  onAddTrait,
  onEditGroup,
  onDeleteGroup,
  onRemoveTrait,
}: PersonalityGroupCardProps) {
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
            <Button variant="outline" size="sm" onClick={() => onAddTrait(group)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Trait
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
        {traits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No traits in this group</p>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Traits in this group:</h4>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait) => (
                <Badge key={trait.id} variant="outline" className="flex items-center gap-1">
                  {trait.name}
                  <button
                    type="button"
                    onClick={() => onRemoveTrait(trait.id)}
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
