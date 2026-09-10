"use client";

import { useState } from 'react';
import { OutbornAccountDirectoryPanel } from './OutbornAccountDirectoryPanel';
import { SafeGroupsTab, UsersPageHeader, UsersPageTabs, type UsersSettingsTabId } from './UsersPageParts';

export function ManageUsersPageContent({ accountsOnly = false }: { accountsOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<UsersSettingsTabId>('users');
  return <div className="flex h-full flex-col">
    <UsersPageHeader activeTab={activeTab} />
    {!accountsOnly && <UsersPageTabs activeTab={activeTab} onTabChange={setActiveTab} />}
    <div className="min-h-0 flex-1 overflow-auto px-6 pb-6"><div className="h-full min-h-0">{activeTab === 'users' && <OutbornAccountDirectoryPanel />}{!accountsOnly && activeTab === 'groups' && <SafeGroupsTab />}</div></div>
  </div>;
}
