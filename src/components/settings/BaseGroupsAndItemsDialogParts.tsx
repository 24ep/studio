"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, List, Settings, Users } from 'lucide-react';
import {
  BaseGroupFormFields,
  type BaseGroupFormData,
  type BaseItem,
} from './BaseGroupsAndItemsParts';

export function BaseGroupDetailsTabs({
  groupFormData,
  groupTitle,
  items,
  showSkillFields,
  onCancel,
  onGroupFormDataChange,
  onSave,
}: {
  groupFormData: BaseGroupFormData;
  groupTitle: string;
  items: BaseItem[];
  showSkillFields: boolean;
  onCancel: () => void;
  onGroupFormDataChange: (data: BaseGroupFormData) => void;
  onSave: () => void;
}) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <BaseGroupDetailsTabsList />
      <BaseGroupDetailsFormTab
        formData={groupFormData}
        groupTitle={groupTitle}
        onCancel={onCancel}
        onChange={onGroupFormDataChange}
        onSave={onSave}
      />
      <BaseGroupDetailsSkillsTab items={items} showSkillFields={showSkillFields} />
      <BaseGroupDetailsPlaceholderTab
        value="positions"
        title="Position Assignments"
        description="This group is assigned to the following positions:"
        placeholder="Position assignment functionality will be implemented here."
      />
      <BaseGroupDetailsPlaceholderTab
        value="activity"
        title="Activity Logs"
        description="Recent activity for this group:"
        placeholder="Activity logging functionality will be implemented here."
      />
    </Tabs>
  );
}

function BaseGroupDetailsTabsList() {
  return (
    <TabsList variant="subnav" className="grid w-full grid-cols-4">
      <TabsTrigger value="details" className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Group Details
      </TabsTrigger>
      <TabsTrigger value="skills" className="flex items-center gap-2">
        <List className="h-4 w-4" />
        Skills List
      </TabsTrigger>
      <TabsTrigger value="positions" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Position Assign
      </TabsTrigger>
      <TabsTrigger value="activity" className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Activity Logs
      </TabsTrigger>
    </TabsList>
  );
}

function BaseGroupDetailsFormTab({
  formData,
  groupTitle,
  onCancel,
  onChange,
  onSave,
}: {
  formData: BaseGroupFormData;
  groupTitle: string;
  onCancel: () => void;
  onChange: (data: BaseGroupFormData) => void;
  onSave: () => void;
}) {
  return (
    <TabsContent value="details" className="space-y-4">
      <div className="space-y-4">
        <BaseGroupFormFields
          formData={formData}
          groupTitle={groupTitle}
          onChange={onChange}
          idPrefix="group-details"
        />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium leading-none">Active Status</div>
            <p className="text-sm text-muted-foreground">
              Enable or disable this group
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </TabsContent>
  );
}

function BaseGroupDetailsSkillsTab({
  items,
  showSkillFields,
}: {
  items: BaseItem[];
  showSkillFields: boolean;
}) {
  return (
    <TabsContent value="skills" className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-lg font-semibold">Skills in this group</h4>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills in this group</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <BaseGroupDetailsSkillRow
                key={item.id}
                item={item}
                showSkillFields={showSkillFields}
              />
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}

function BaseGroupDetailsSkillRow({
  item,
  showSkillFields,
}: {
  item: BaseItem;
  showSkillFields: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="font-medium">{item.name}</div>
        {item.description && (
          <div className="text-sm text-muted-foreground">{item.description}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
        {showSkillFields && (
          <Badge variant="outline">
            Max: {item.maxScore}
          </Badge>
        )}
      </div>
    </div>
  );
}

function BaseGroupDetailsPlaceholderTab({
  description,
  placeholder,
  title,
  value,
}: {
  description: string;
  placeholder: string;
  title: string;
  value: string;
}) {
  return (
    <TabsContent value={value} className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {placeholder}
          </p>
        </div>
      </div>
    </TabsContent>
  );
}
