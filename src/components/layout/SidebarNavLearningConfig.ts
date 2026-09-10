import { iconMap, sidebarConfig, sidebarConfigData, type SidebarNavGroup } from './SidebarNavConfig';

const managementItemsData = [
  {
    label: 'Learning Management',
    icon: 'AcademicCap',
    href: '/learning/manage',
    exact: true,
    description: 'Manage assignments, reviews, completion exceptions, and learning operations',
    section: 'Learning management',
    permissionId: 'HR_LEARNING_MANAGE' as const,
  },
  {
    label: 'Assignment Reviews',
    icon: 'ClipboardCheck',
    href: '/learning/manage/reviews',
    description: 'Review learner assignment submissions and request changes',
    section: 'Learning management',
    permissionId: 'HR_LEARNING_MANAGE' as const,
  },
  {
    label: 'Learning Reports',
    icon: 'BarChart3',
    href: '/learning/manage/reports',
    description: 'Track company learning progress, overdue work, and completion',
    section: 'Learning management',
    permissionId: 'HR_LEARNING_MANAGE' as const,
  },
];

export const sidebarConfigDataWithLearningManagement = sidebarConfigData.map(group =>
  group.id === 'learning'
    ? { ...group, items: [...group.items, ...managementItemsData] }
    : group,
);

export const sidebarConfigWithLearningManagement: SidebarNavGroup[] = sidebarConfig.map(group =>
  group.id === 'learning'
    ? {
        ...group,
        items: [
          ...group.items,
          ...managementItemsData.map(item => ({
            ...item,
            icon: iconMap[item.icon as keyof typeof iconMap],
          })),
        ],
      }
    : group,
);
