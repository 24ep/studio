"use client";

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Heart } from 'lucide-react';

export function SkillTemplateGroupsSection({
  title,
  icon,
  count,
  emptyText,
  groups,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  emptyText: string;
  groups: Array<{ id: string; name: string; description?: string; color: string }>;
}) {
  return (
    <div>
      <h4 className="font-medium mb-3 flex items-center gap-2">
        {icon}
        {title} ({count})
      </h4>
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-medium">{group.name}</span>
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

export function SkillTemplateSkillsSection({
  title,
  icon,
  count,
  emptyText,
  skills,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  emptyText: string;
  skills: Array<{ id: string; name: string; description?: string; skillType: string }>;
}) {
  return (
    <div>
      <h4 className="font-medium mb-3 flex items-center gap-2">
        {icon}
        {title} ({count})
      </h4>
      {skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <Card key={skill.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{skill.name}</span>
                </div>
                {skill.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {skill.description}
                  </p>
                )}
                <Badge variant="outline" className="mt-2">
                  {skill.skillType}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

export function SkillTemplateTraitsSection({
  traits,
}: {
  traits: Array<{ id: string; name: string; description?: string }>;
}) {
  return (
    <div>
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <Heart className="h-4 w-4" />
        Personality Traits ({traits.length})
      </h4>
      {traits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {traits.map((trait) => (
            <Card key={trait.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{trait.name}</span>
                </div>
                {trait.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {trait.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No personality traits assigned</p>
      )}
    </div>
  );
}
