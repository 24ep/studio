"use client";

import { AlertCircle, CheckCircle, Edit, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { PersonalityTrait } from "./PersonalityTraitsTabTypes";

interface PersonalityTraitsTableProps {
  traits: PersonalityTrait[];
  onEdit: (trait: PersonalityTrait) => void;
  onDelete: (traitId: string) => void;
  onToggleActive: (traitId: string, isActive: boolean) => void;
}

export function PersonalityTraitsTable({
  traits,
  onEdit,
  onDelete,
  onToggleActive,
}: PersonalityTraitsTableProps) {
  if (traits.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No personality traits found. Create your first trait to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personality Traits</CardTitle>
        <CardDescription>
          Manage all personality traits and their configurations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {traits.map((trait) => (
              <TableRow key={trait.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{trait.name}</div>
                    {trait.description && (
                      <div className="text-sm text-muted-foreground">{trait.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {trait.group ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: trait.group.color }}
                      />
                      {trait.group.name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No category</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleActive(trait.id, trait.isActive)}
                  >
                    {trait.isActive ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Inactive
                      </>
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(trait)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(trait.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
