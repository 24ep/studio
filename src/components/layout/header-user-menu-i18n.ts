export type HeaderUserMenuLabels = {
  openUserMenu: string; signedInAs: string; userFallback: string; myProfile: string; profile: string; security: string;
  settings: string; settingsDescription: string; appearance: string; localization: string; english: string; thai: string;
  light: string; dark: string; system: string; clearCache: string; clearCacheDescription: string; signOut: string;
  signOutDescription: string; version: string; previewTools: string; adminPreviewTools: string; previewAsRole: string;
  previewAsUser: string; recruiterView: string; hiringManagerView: string; managerView: string; searchUsers: string;
  searchUsersToPreview: string; searchUsersHint: string; enterSearchHint: string;
};

const en: HeaderUserMenuLabels = {
  openUserMenu: 'Open user menu', signedInAs: 'Signed in as', userFallback: 'User', myProfile: 'My Profile', profile: 'Profile',
  security: 'Security', settings: 'Admin Center', settingsDescription: 'Organization settings and platform controls', appearance: 'Appearance',
  localization: 'Language', english: 'English', thai: 'Thai', light: 'Light', dark: 'Dark', system: 'System', clearCache: 'Clear Cache',
  clearCacheDescription: 'Refresh local data and assets', signOut: 'Sign Out', signOutDescription: 'End your current session', version: 'Version',
  previewTools: 'Preview Tools', adminPreviewTools: 'Admin Preview Tools', previewAsRole: 'Preview as Role', previewAsUser: 'Preview as User',
  recruiterView: 'Recruiter View', hiringManagerView: 'Hiring Manager View', managerView: 'Manager View', searchUsers: 'Search users...',
  searchUsersToPreview: 'Search users to preview...', searchUsersHint: 'Type at least 2 characters to search active users',
  enterSearchHint: 'Enter search term to find users to preview as',
};

const th: HeaderUserMenuLabels = {
  openUserMenu: 'เปิดเมนูผู้ใช้', signedInAs: 'เข้าสู่ระบบในชื่อ', userFallback: 'ผู้ใช้', myProfile: 'โปรไฟล์ของฉัน', profile: 'โปรไฟล์',
  security: 'ความปลอดภัย', settings: 'ศูนย์ผู้ดูแลระบบ', settingsDescription: 'การตั้งค่าองค์กรและการควบคุมแพลตฟอร์ม', appearance: 'รูปแบบการแสดงผล', localization: 'ภาษา',
  english: 'English', thai: 'ไทย', light: 'สว่าง', dark: 'มืด', system: 'ตามระบบ', clearCache: 'ล้างแคช',
  clearCacheDescription: 'รีเฟรชข้อมูลและไฟล์ในเครื่อง', signOut: 'ออกจากระบบ', signOutDescription: 'สิ้นสุดเซสชันปัจจุบัน', version: 'เวอร์ชัน',
  previewTools: 'เครื่องมือแสดงตัวอย่าง', adminPreviewTools: 'เครื่องมือแสดงตัวอย่างสำหรับผู้ดูแล', previewAsRole: 'ดูตัวอย่างตามบทบาท',
  previewAsUser: 'ดูตัวอย่างในฐานะผู้ใช้', recruiterView: 'มุมมองผู้สรรหา', hiringManagerView: 'มุมมองผู้จัดการฝ่ายว่าจ้าง', managerView: 'มุมมองผู้จัดการ',
  searchUsers: 'ค้นหาผู้ใช้...', searchUsersToPreview: 'ค้นหาผู้ใช้เพื่อดูตัวอย่าง...', searchUsersHint: 'พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหาผู้ใช้ที่ใช้งานอยู่',
  enterSearchHint: 'ป้อนคำค้นหาเพื่อค้นหาผู้ใช้สำหรับดูตัวอย่าง',
};

export function getHeaderUserMenuLabels(language?: string | null): HeaderUserMenuLabels {
  return language?.toLowerCase().startsWith('th') ? th : en;
}
