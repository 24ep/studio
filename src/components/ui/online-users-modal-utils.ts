export function formatOnlineUserLastSeen(lastSeen: Date | string) {
  const now = new Date();
  const lastSeenDate = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);

  if (isNaN(lastSeenDate.getTime())) {
    return "Unknown";
  }

  const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  const days = Math.floor(diffInSeconds / 86400);
  return `${days}d ago`;
}

export function getOnlineUserPageDisplayName(pathname: string) {
  const pathMap: Record<string, string> = {
    "/": "Dashboard",
    "/applicants": "Applicants",
    "/positions": "Positions",
    "/my-tasks": "My Tasks",
    "/settings": "Settings",
    "/settings/users": "User Management",
    "/settings/user-groups": "User Groups",
    "/settings/applicant-sources": "Applicant Sources",
    "/settings/recruitment-stages": "Recruitment Stages",
    "/settings/system": "System Settings",
  };

  if (pathMap[pathname]) {
    return pathMap[pathname];
  }

  if (pathname.startsWith("/applicants/")) {
    return "Applicant Details";
  }

  if (pathname.startsWith("/positions/")) {
    return "Position Details";
  }

  return pathname
    .split("/")
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" / ");
}

export function getOnlineUserInitials(userName: string) {
  return userName.split(" ").map(namePart => namePart[0]).join("").toUpperCase();
}
