export interface UnifiedRoleMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UnifiedRoleMembersPage {
  filteredMembers: UnifiedRoleMember[];
  paginatedMembers: UnifiedRoleMember[];
  startIndex: number;
  totalFilteredMembers: number;
  totalPages: number;
}

interface GetUnifiedRoleMembersPageOptions {
  members: UnifiedRoleMember[];
  page: number;
  perPage: number;
  searchTerm: string;
}

export function getUnifiedRoleMemberInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatUnifiedRoleMemberDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

export function getUnifiedRoleMembersPage({
  members,
  page,
  perPage,
  searchTerm,
}: GetUnifiedRoleMembersPageOptions): UnifiedRoleMembersPage {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredMembers = members.filter((member) => {
    if (!member?.id || !member.name) {
      return false;
    }

    if (!normalizedSearchTerm) {
      return true;
    }

    return (
      member.name.toLowerCase().includes(normalizedSearchTerm) ||
      member.email.toLowerCase().includes(normalizedSearchTerm)
    );
  });

  const totalFilteredMembers = filteredMembers.length;
  const totalPages = Math.ceil(totalFilteredMembers / perPage);
  const startIndex = (page - 1) * perPage;

  return {
    filteredMembers,
    paginatedMembers: filteredMembers.slice(startIndex, startIndex + perPage),
    startIndex,
    totalFilteredMembers,
    totalPages,
  };
}
