"use client";

import { AlertCircle, CheckCircle, Edit, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { ExpertiseSkill } from "./ExpertiseSkillsTabTypes";

interface ExpertiseSkillsTableProps {
  skills: ExpertiseSkill[];
  onEdit: (skill: ExpertiseSkill) => void;
  onDelete: (skillId: string) => void;
  onToggleActive: (skillId: string, isActive: boolean) => void;
}

export function ExpertiseSkillsTable({
  skills,
  onEdit,
  onDelete,
  onToggleActive,
}: ExpertiseSkillsTableProps) {
  if (skills.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No expertise skills found. Create your first skill to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expertise Skills</CardTitle>
        <CardDescription>
          Manage all expertise skills and their configurations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Max Score</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.map((skill) => (
              <TableRow key={skill.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    {skill.description && (
                      <div className="text-sm text-muted-foreground">{skill.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{skill.maxScore}</TableCell>
                <TableCell>
                  {skill.group ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: skill.group.color }}
                      />
                      {skill.group.name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No group</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleActive(skill.id, skill.isActive)}
                  >
                    {skill.isActive ? (
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
                      onClick={() => onEdit(skill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(skill.id)}
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
