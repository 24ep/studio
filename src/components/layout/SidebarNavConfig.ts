import {
  Squares2X2Icon as LayoutDashboard,
  UsersIcon as Users,
  BriefcaseIcon as Briefcase,
  Cog6ToothIcon as Settings,
  ClipboardDocumentListIcon as ListTodo,
  CloudArrowUpIcon as UploadCloud,
  DocumentTextIcon as FileText,
  ChartBarIcon as BarChart3,
  CalendarIcon as Calendar,
  CalendarDaysIcon as CalendarDays,
  ClockIcon as Clock,
  ChatBubbleLeftRightIcon as MessageSquare,
  ShieldCheckIcon as Shield,
  CircleStackIcon as Database,
  BoltIcon as Zap,
  FlagIcon as Target,
  ViewColumnsIcon as Kanban,
  ExclamationTriangleIcon as AlertTriangle,
  ClipboardDocumentCheckIcon as ClipboardCheck,
  PaintBrushIcon as Palette,
  CpuChipIcon as BrainCircuit,
  ShareIcon as Webhook,
  CodeBracketIcon as Code2,
  ListBulletIcon as ListOrdered,
  UserPlusIcon as UserPlus,
  IdentificationIcon as Identification,
  FolderIcon as Folder,
  AcademicCapIcon as AcademicCap,
  BuildingOffice2Icon as BuildingOffice,
  BanknotesIcon as Banknotes,
  ChartPieIcon as ChartPie,
  MegaphoneIcon as Megaphone,
  EnvelopeIcon as Mail,
  DevicePhoneMobileIcon as Smartphone,
  WindowIcon as Popup,
  TrophyIcon as Trophy,
  GlobeAltIcon as Globe,
  PhotoIcon as Photo,
  PencilSquareIcon as PencilSquare,
  TrashIcon as Trash,
  ArrowRightOnRectangleIcon as LogOut,
  HeartIcon as Heart,
  ComputerDesktopIcon as ComputerDesktop,
  TruckIcon as Truck,
} from "@heroicons/react/24/outline";
import type { ElementType } from "react";
import type { PlatformModuleId } from "@/lib/types";

export type SidebarNavIcon = ElementType<{ className?: string }>;

export interface SidebarNavItem {
  label: string;
  icon: SidebarNavIcon;
  href: string;
  exact?: boolean;
  adminOnly?: boolean;
  badge?: string;
  description?: string;
  section?: string;
  permissionId?: PlatformModuleId;
  permissionIds?: PlatformModuleId[];
}

export interface SidebarNavGroup {
  id: string;
  label: string;
  icon: SidebarNavIcon;
  items: SidebarNavItem[];
}

// Icon mapping for API serialization
export const iconMap = {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  ListTodo,
  UploadCloud,
  FileText,
  BarChart3,
  Calendar,
  CalendarDays,
  Clock,
  MessageSquare,
  Shield,
  Database,
  Zap,
  Target,
  Kanban,
  AlertTriangle,
  ClipboardCheck,
  Palette,
  BrainCircuit,
  Webhook,
  Share: Webhook,
  Code2,
  ListOrdered,
  UserPlus,
  Identification,
  Folder,
  AcademicCap,
  BuildingOffice,
  Banknotes,
  ChartPie,
  Megaphone,
  Mail,
  Smartphone,
  Popup,
  Trophy,
  Globe,
  Photo,
  PencilSquare,
  Trash,
  LogOut,
  Heart,
  ComputerDesktop,
  Truck,
  Wrench: AlertTriangle,
};

// Config with icon names instead of components for API serialization
export const sidebarConfigData = [
  {
    id: "employee-portal",
    label: "Employee Portal",
    icon: "LayoutDashboard",
    items: [
      {
        label: "Admin Portal",
        icon: "BarChart3",
        href: "/dashboard",
        description: "Explore dashboards, metrics, and operational insights",
        section: "Employee Portal",
        permissionId: "DASHBOARD_VIEW"
      },
      {
        label: "HR Dashboard",
        icon: "ChartPie",
        href: "/hr-dashboard",
        exact: true,
        description: "Hiring outcomes, interviews, trends, and pipeline analytics",
        section: "Employee Portal",
        permissionId: "DASHBOARD_VIEW"
      },
      {
        label: "Employee Portal",
        icon: "LayoutDashboard",
        href: "/employee-portal",
        exact: true,
        description: "Employee intranet news and company content",
        permissionId: "COMPANY_PORTAL_VIEW"
      },
      {
        label: "My Workday",
        icon: "Calendar",
        href: "/my-workday",
        exact: true,
        description: "Personal workday summary and quick actions",
        section: "Employee Portal"
      },
    ],
  },
  {
    id: "recruitment",
    label: "Recruitment",
    icon: "UserPlus",
    items: [
      {
        label: "Headcount Requests",
        icon: "Briefcase",
        href: "/hiring/headcount-requests",
        description: "Create and track headcount request tickets",
        section: "Planning",
        permissionId: "POSITIONS_VIEW"
      },
      {
        label: "Job Openings",
        icon: "Briefcase",
        href: "/positions",
        description: "Open headcount and job positions",
        section: "Pipeline",
        permissionId: "POSITIONS_VIEW"
      },
      {
        label: "Applicants",
        icon: "Users",
        href: "/applicants",
        description: "Manage applicant profiles",
        section: "Pipeline",
        permissionId: "applicantS_VIEW"
      },
      {
        label: "Interview Calendar",
        icon: "Calendar",
        href: "/calendar",
        description: "Interview scheduling and evaluation links",
        section: "Selection",
        permissionId: "EVALUATION_LINKS_VIEW"
      },
      {
        label: "Job Offers",
        icon: "FileText",
        href: "/job-offers",
        description: "Create, send, and track signed offer letters",
        section: "Selection",
        permissionId: "applicantS_VIEW"
      },
      {
        label: "AI Processing Queue",
        icon: "UploadCloud",
        href: "/process-queue",
        description: "Monitor and manage AI resume processing jobs",
        section: "Automation",
        permissionId: "UPLOAD_QUEUE_VIEW"
      },
    ],
  },
  {
    id: "client",
    label: "Clients",
    icon: "BuildingOffice",
    items: [
      {
        label: "Client List",
        icon: "BuildingOffice",
        href: "/clients",
        exact: true,
        description: "Customer organizations and primary contact details",
        section: "Client records",
        permissionId: "HR_PEOPLE_VIEW"
      },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: "Users",
    items: [
      {
        label: "Employees",
        icon: "Users",
        href: "/people",
        exact: true,
        description: "Employee and user directory",
        section: "People records",
        permissionId: "HR_PEOPLE_VIEW"
      },
      {
        label: "Onboarding",
        icon: "ClipboardCheck",
        href: "/people/onboarding",
        exact: true,
        description: "Profile readiness, onboarding checklists, and assigned courses",
        section: "People records",
        permissionId: "HR_PEOPLE_VIEW"
      },
      {
        label: "Org Chart",
        icon: "Share",
        href: "/people/org-chart",
        description: "Reporting lines and organization structure",
        section: "People records",
        permissionId: "HR_PEOPLE_VIEW"
      },
      {
        label: "Probation",
        icon: "Clock",
        href: "/people/probation",
        description: "Track probation dates and upcoming evaluations",
        section: "People records",
        permissionId: "HR_PEOPLE_VIEW"
      },
      {
        label: "Offboarding",
        icon: "LogOut",
        href: "/people/offboarding",
        description: "Manage resignations, exits, clearance, and final-day readiness",
        section: "People records",
        permissionId: "HR_PEOPLE_MANAGE"
      },
      {
        label: "Contracts",
        icon: "Clock",
        href: "/people/contracts",
        exact: true,
        description: "Monitor contract end dates, notice periods, renewals, and missing data",
        section: "People records",
        permissionId: "HR_PEOPLE_VIEW"
      },
      {
        label: "Assets",
        icon: "ComputerDesktop",
        href: "/people/assets",
        exact: true,
        description: "Track equipment inventory, employee custody, returns, and reuse",
        section: "People records",
        permissionId: "HR_PEOPLE_VIEW"
      },
      {
        label: "Service Desk",
        icon: "MessageSquare",
        href: "/service-desk",
        exact: true,
        description: "Manage employee questions, requests, and confidential follow-up",
        section: "Support"
      },
    ],
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: "CalendarDays",
    items: [
      {
        label: "Attendance",
        icon: "Clock",
        href: "/workforce/attendance?view=attendance",
        description: "Review attendance records and daily exceptions",
        section: "Time",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Timesheets",
        icon: "ClipboardCheck",
        href: "/workforce/attendance?view=timesheet",
        description: "Review and approve employee timesheets",
        section: "Time",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Roster",
        icon: "CalendarDays",
        href: "/workforce/attendance?view=roster",
        description: "Plan and publish employee shift rosters",
        section: "Time",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Attendance Requests",
        icon: "CalendarDays",
        href: "/workforce/attendance?view=requests",
        description: "Review and decide employee attendance corrections",
        section: "Time",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Shift Requests",
        icon: "CalendarDays",
        href: "/workforce/leave?type=shift-request",
        description: "Review schedule changes, swaps, and open-shift requests",
        section: "Time",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Overtime",
        icon: "Clock",
        href: "/workforce/attendance?view=overtime",
        description: "Review and manage overtime requests",
        section: "Time",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Transportation",
        icon: "Truck",
        href: "/workforce/transportation",
        description: "Manage employee transport routes and assignments",
        section: "Time",
        permissionId: "HR_WORKFORCE_VIEW"
      },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    icon: "BarChart3",
    items: [
      {
        label: "Performance",
        icon: "BarChart3",
        href: "/workforce/performance",
        exact: true,
        description: "Manage goals, check-ins, development, and performance insights",
        permissionId: "HR_PERFORMANCE_VIEW"
      },
    ],
  },
  {
    id: "leaves",
    label: "Leave",
    icon: "Calendar",
    items: [
      {
        label: "Leave Request",
        icon: "Calendar",
        href: "/workforce/leave",
        exact: true,
        description: "Review employee leave requests and balances",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Leave Control Panel",
        icon: "Settings",
        href: "/workforce/leave/control-panel",
        description: "Monitor leave operations, exceptions, and approvals",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Leave Allocation",
        icon: "CalendarDays",
        href: "/workforce/leave/allocation",
        description: "Run leave allocations and reconcile balances",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Leave Policy Assignment",
        icon: "ClipboardCheck",
        href: "/workforce/leave/policy-assignment",
        description: "Assign leave policies to eligible employees",
        permissionId: "HR_WORKFORCE_VIEW"
      },
      {
        label: "Leave Encashment",
        icon: "Banknotes",
        href: "/workforce/leave/encashment",
        description: "Review leave encashment eligibility and requests",
        permissionId: "HR_WORKFORCE_VIEW"
      },
    ],
  },
  {
    id: "data-and-analytics",
    label: "Data & Analytics",
    icon: "ChartPie",
    items: [
      {
        label: "Import",
        icon: "UploadCloud",
        href: "/data-operations?mode=import",
        description: "Import workforce data from supported file formats.",
        section: "System data transfer",
        permissionId: "UPLOAD_QUEUE_VIEW"
      },
      {
        label: "Export",
        icon: "UploadCloud",
        href: "/data-operations?mode=export",
        description: "Generate system-export packages and reports.",
        section: "System data transfer",
        permissionId: "UPLOAD_QUEUE_VIEW"
      },
    ],
  },
  {
    id: "learning",
    label: "Learning",
    icon: "AcademicCap",
    items: [
      {
        label: "My Learning",
        icon: "AcademicCap",
        href: "/learning",
        exact: true,
        description: "Assigned learning and course progress",
        section: "My learning"
      },
      {
        label: "Courses",
        icon: "AcademicCap",
        href: "/learning/courses",
        description: "Learning course catalog and creation",
        section: "Learning",
        permissionId: "HR_LEARNING_VIEW"
      },
      {
        label: "Learning Paths",
        icon: "ListTodo",
        href: "/learning/paths",
        description: "Role-based learning journeys and course sequences",
        section: "Learning",
        permissionId: "HR_LEARNING_VIEW"
      },
      {
        label: "Achievements",
        icon: "Trophy",
        href: "/learning/achievements",
        description: "Badge canvas and achievement conditions",
        section: "Learning",
        permissionId: "HR_LEARNING_VIEW"
      },
      {
        label: "Career Explorer",
        icon: "Target",
        href: "/learning/career-explorer",
        description: "Explore career paths from your current role and strengths",
        section: "Learning",
        permissionId: "HR_LEARNING_VIEW"
      },
      {
        label: "Employee Certificates",
        icon: "FileText",
        href: "/learning/certificates",
        description: "Employee credentials awaiting or requiring HR verification",
        section: "Learning",
        permissionId: "HR_LEARNING_VIEW"
      },
      {
        label: "Trusted Certificates",
        icon: "Shield",
        href: "/learning/trusted-certificates",
        description: "Certificate register reviewed and verified by HR",
        section: "Learning",
        permissionId: "HR_LEARNING_VIEW"
      },
    ],
  },
  {
    id: "job-portal",
    label: "Job Portal",
    icon: "Globe",
    items: [
      {
        label: "Job Portal",
        icon: "Globe",
        href: "/job-portal",
        exact: true,
        description: "Job portal workspace generated from CMS configuration",
        section: "Job Portal",
        permissionId: "COMPANY_PORTAL_VIEW"
      },
    ],
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: "Banknotes",
    items: [
      {
        label: "Payroll",
        icon: "Banknotes",
        href: "/payroll",
        description: "Payroll overview and finance-facing HR metrics",
        section: "Payroll",
        permissionId: "HR_PAYROLL_VIEW"
      },
      {
        label: "Payroll Runs",
        icon: "ListTodo",
        href: "/payroll/runs",
        description: "Payroll periods, run status, gross totals, and net totals",
        section: "Payroll",
        permissionId: "HR_PAYROLL_VIEW"
      },
      {
        label: "Payslips",
        icon: "FileText",
        href: "/payroll/payslips",
        description: "Generate and review employee payslips",
        section: "Payroll",
        permissionId: "HR_PAYROLL_VIEW"
      },
      {
        label: "Compensation",
        icon: "Briefcase",
        href: "/payroll/compensation",
        description: "Position level and compensation planning",
        section: "Payroll",
        permissionId: "HR_PAYROLL_VIEW"
      },
      {
        label: "Benefits",
        icon: "Shield",
        href: "/payroll/benefits",
        description: "Benefits reference data and eligibility setup",
        section: "Payroll",
        permissionId: "HR_PAYROLL_VIEW"
      },
      {
        label: "Reports",
        icon: "ChartPie",
        href: "/payroll/reports",
        description: "Payroll reporting and operational monitoring",
        section: "Payroll",
        permissionId: "HR_PAYROLL_VIEW"
      },
    ],
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: "Banknotes",
    items: [
      {
        label: "Expense Claims",
        icon: "FileText",
        href: "/expenses/claims",
        description: "Create, review, and track employee expense claims",
        section: "Expenses",
        permissionId: "EXPENSES_VIEW"
      },
      {
        label: "Employee Advances",
        icon: "Banknotes",
        href: "/expenses/advances",
        description: "Request and track employee cash advances",
        section: "Expenses",
        permissionId: "EXPENSES_VIEW"
      },
      {
        label: "Travel Requests",
        icon: "Globe",
        href: "/expenses/travel",
        description: "Submit and manage business travel requests",
        section: "Expenses",
        permissionId: "EXPENSES_VIEW"
      },
      {
        label: "Expense Accounting",
        icon: "ChartPie",
        href: "/expenses/accounting",
        description: "Review expense payments, journals, and reconciliation",
        section: "Expenses",
        permissionId: "EXPENSES_FINANCE"
      },
    ],
  },
  {
    id: "ess",
    label: "ESS",
    icon: "Identification",
    items: [
      {
        label: "My Profile",
        icon: "Identification",
        href: "/ess/profile",
        description: "Personal details and profile change requests",
        section: "Employee service"
      },
      {
        label: "My Leave",
        icon: "CalendarDays",
        href: "/ess/leave",
        description: "Leave balances, requests, and history",
        section: "Employee service"
      },
      {
        label: "My Attendance",
        icon: "Calendar",
        href: "/ess/attendance",
        description: "Recent attendance, exceptions, and shift schedule",
        section: "Employee service"
      },
      {
        label: "Shift Requests",
        icon: "CalendarDays",
        href: "/ess/shift-requests",
        description: "Request schedule changes, swaps, or open shifts",
        section: "Employee service"
      },
      {
        label: "Attendance Corrections",
        icon: "Clock",
        href: "/ess/attendance-corrections",
        description: "Correct missing or inaccurate attendance records",
        section: "Employee service"
      },
      {
        label: "Overtime Requests",
        icon: "Clock",
        href: "/ess/overtime",
        description: "Submit and track overtime requests",
        section: "Employee service"
      },
      {
        label: "My Documents",
        icon: "Folder",
        href: "/ess/documents",
        description: "Employee documents and requested uploads",
        section: "Employee service"
      },
      {
        label: "My Benefits",
        icon: "Heart",
        href: "/ess/benefits",
        description: "Browse available plans and apply for benefit coverage",
        section: "Employee service"
      },
      {
        label: "My Performance",
        icon: "BarChart3",
        href: "/ess/performance",
        description: "Goals, reviews, and employee acknowledgements",
        section: "Growth"
      },
      {
        label: "My Surveys",
        icon: "ListTodo",
        href: "/ess/surveys",
        description: "Assigned surveys and response history",
        section: "Growth"
      },
      {
        label: "My Team",
        icon: "Users",
        href: "/ess/team",
        description: "Manager approvals and direct reports",
        section: "Manager service"
      },
    ],
  },
  {
    id: "broadcast",
    label: "Communications",
    icon: "Megaphone",
    items: [
      {
        label: "SMS Broadcasting",
        icon: "Smartphone",
        href: "/broadcast/sms",
        description: "Send short mobile announcements to selected audiences",
        section: "Channels"
      },
      {
        label: "Email Announcements",
        icon: "Mail",
        href: "/broadcast/email",
        description: "Prepare email announcements and review delivery history",
        section: "Channels"
      },
      {
        label: "Banner Setup",
        icon: "Megaphone",
        href: "/broadcast/banner",
        description: "Configure in-app banners and review banner history",
        section: "In-app"
      },
      {
        label: "First-Time Popup",
        icon: "Popup",
        href: "/broadcast/popup",
        description: "Create announcement popups shown when users first open the app",
        section: "In-app"
      },
    ],
  },
  {
    id: "admin-center",
    label: "Admin Center",
    icon: "Settings",
    items: [
      {
        label: "Overview",
        icon: "LayoutDashboard",
        href: "/settings/overview",
        exact: true,
        description: "Find configuration areas and open frequently used settings",
        section: "Configuration",
      },
      {
        label: "HR Setup",
        icon: "Settings",
        href: "/settings",
        exact: true,
        description: "Configure organization, position, and recruitment setup",
        section: "Configuration",
      },
      {
        label: "User Accounts",
        icon: "Identification",
        href: "/settings?adminTab=user-accounts",
        description: "Manage platform accounts, status, and sign-in access",
        section: "Configuration",
        permissionId: "USERS_VIEW"
      },
      {
        label: "Roles & Permissions",
        icon: "Users",
        href: "/settings?adminTab=roles-permissions",
        description: "Define roles and reusable permission policies",
        section: "Configuration",
        permissionId: "USERS_VIEW"
      },
      {
        label: "User Teams",
        icon: "Users",
        href: "/settings/user-teams",
        description: "Manage user teams used for ownership, routing, and access policy grouping.",
        section: "Configuration",
        permissionId: "USERS_VIEW"
      },
      {
        label: "Preferences",
        icon: "Palette",
        href: "/settings?adminTab=branding",
        description: "Configure application branding and preferences",
        section: "Configuration",
        permissionId: "SYSTEM_SETTINGS_VIEW"
      },
      {
        label: "Field Management",
        icon: "ListTodo",
        href: "/settings?adminTab=field-management",
        description: "Manage platform data fields and models",
        section: "Configuration",
        permissionId: "CUSTOM_FIELDS_EDIT"
      },
      {
        label: "Communication",
        icon: "Mail",
        href: "/settings?adminTab=communication",
        description: "Configure notifications, email, webhooks, and meeting rooms",
        section: "Configuration",
        permissionId: "SYSTEM_SETTINGS_VIEW"
      },
      {
        label: "AI",
        icon: "BrainCircuit",
        href: "/settings?adminTab=ai",
        description: "Configure AI services, prompts, matching, knowledge, and screening",
        section: "Configuration",
        permissionId: "SYSTEM_SETTINGS_VIEW"
      },
      {
        label: "Integrations & API",
        icon: "Code2",
        href: "/settings?adminTab=integrations-api",
        description: "Configure APIs, credentials, webhooks, synchronization, and connection policy",
        section: "Platform Governance",
        permissionId: "SYSTEM_SETTINGS_VIEW"
      },
      {
        label: "Security & Governance",
        icon: "Shield",
        href: "/settings?adminTab=security-governance",
        description: "Configure authentication, access, retention, feature, and data policies",
        section: "Platform Governance",
        permissionId: "SYSTEM_SETTINGS_VIEW"
      },
      {
        label: "Billing",
        icon: "Banknotes",
        href: "/settings?adminTab=billing",
        description: "Manage subscription and billing settings",
        section: "Configuration",
        permissionId: "SYSTEM_SETTINGS_VIEW"
      },
      {
        label: "Audit, Logs & Monitoring",
        icon: "BarChart3",
        href: "/settings?adminTab=logs-monitoring",
        description: "Review audit controls, logs, monitoring, and connected system health",
        section: "Configuration",
        permissionIds: ["SYSTEM_SETTINGS_VIEW", "AUDIT_CONTROLS_VIEW"]
      },
    ],
  },
  {
    id: "other",
    label: "Operations Tools",
    icon: "Wrench",
    items: [
      {
        label: "Employee Fault Detection",
        icon: "AlertTriangle",
        href: "/fault-detection",
        exact: true,
        description: "Review employee conduct, account, and attendance signals",
        section: "Operations",
        permissionId: "HR_PEOPLE_MANAGE"
      },
    ],
  },
  {
    id: "privacy-support",
    label: "Privacy & Support",
    icon: "Shield",
    items: [
      {
        label: "Privacy Policy",
        icon: "Shield",
        href: "/privacy-support/privacy-policy",
        exact: true,
        description: "Read and acknowledge the current employee privacy policy",
        section: "Legal & Privacy"
      },
      {
        label: "Terms of Service",
        icon: "FileText",
        href: "/privacy-support/terms",
        exact: true,
        description: "Review the employee platform terms and acceptable-use conditions",
        section: "Legal & Privacy"
      },
      {
        label: "Data Deletion Request",
        icon: "Trash",
        href: "/privacy-support/data-deletion",
        exact: true,
        description: "Submit and track a reviewed personal-data deletion request",
        section: "Legal & Privacy"
      },
      {
        label: "Release Notes",
        icon: "ListOrdered",
        href: "/privacy-support/releases",
        exact: true,
        description: "See the current version and recent product changes",
        section: "Experience & Platform"
      },
    ],
  },
];

function resolveSidebarIcon(iconName: string): SidebarNavIcon {
  return iconMap[iconName as keyof typeof iconMap] || LayoutDashboard;
}

// Full config with actual icon components for client-side use
export const sidebarConfig: SidebarNavGroup[] = sidebarConfigData.map(group => ({
  ...group,
  icon: resolveSidebarIcon(group.icon),
  items: group.items.map(item => ({
    ...item,
    icon: resolveSidebarIcon(item.icon)
  }))
})); 
