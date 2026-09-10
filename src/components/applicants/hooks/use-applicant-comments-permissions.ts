import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import type {
  ApplicantCommentChannel,
  ApplicantCommentsTab,
} from '../applicant-comments-utils';

export function useApplicantCommentsPermissions() {
  const { data: session } = useSession();
  const userPerms = session?.user?.modulePermissions || [];
  const isAdmin = session?.user?.role === 'Admin';

  const canViewAllComments = isAdmin || userPerms.includes('applicantS_COMMENTS_VIEW');
  const canViewRemarksOnly = userPerms.includes('applicantS_COMMENTS_VIEW_REMARK_ONLY');
  const canViewActivities = isAdmin || userPerms.includes('applicantS_ACTIVITIES_VIEW');

  const [activeSubTab, setActiveSubTab] = useState<ApplicantCommentsTab>('all');
  const [selectedChannel, setSelectedChannel] = useState<ApplicantCommentChannel>('comment');

  useEffect(() => {
    if (!canViewAllComments && canViewRemarksOnly) {
      setActiveSubTab('remark');
      setSelectedChannel('remark');
    } else if (canViewAllComments) {
      setActiveSubTab('all');
      setSelectedChannel('comment');
    }
  }, [canViewAllComments, canViewRemarksOnly]);

  return {
    activeSubTab,
    canViewActivities,
    canViewAllComments,
    canViewRemarksOnly,
    selectedChannel,
    setActiveSubTab,
    setSelectedChannel,
  };
}
