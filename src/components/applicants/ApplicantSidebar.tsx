import React, { useState, useEffect } from 'react';
import {
  BriefcaseIcon,
  ChatBubbleLeftRightIcon as MessageSquare,
  DocumentCheckIcon as FileCheck,
} from '@heroicons/react/24/outline';
import ApplicantCommentsSection from './ApplicantCommentsSection';
import { ApplicantHiringBrief } from './ApplicantHiringBrief';
import type { Applicant } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { canViewEvaluationLinks } from '@/lib/permissions';
import { getJsonString, readJsonObject } from '@/lib/response-json';
import type { ApplicantAttachment } from './applicant-attachment-utils';
import type { ApplicantCommentItem } from './applicant-comments-utils';


import { EvaluateReportSection } from './evaluate-report/EvaluateReportSection';
import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

interface ApplicantSidebarProps {
  applicant: Applicant;
  comments: ApplicantCommentItem[];
  resumes: ApplicantAttachment[];
  isEditing: boolean;
  onRefresh: () => void;
  defaultTab?: 'hiring' | 'comments';
  reviewMode?: boolean;
}

export const ApplicantSidebar: React.FC<ApplicantSidebarProps> = ({
  applicant,
  comments,
  resumes,
  isEditing,
  onRefresh,
  defaultTab = 'comments',
  reviewMode = false,
}) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [hasEvaluationLink, setHasEvaluationLink] = useState<boolean>(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const canViewLinks = canViewEvaluationLinks(session?.user).canView;

  useEffect(() => {
    if (!canViewLinks) {
      setHasEvaluationLink(false);
      setCheckingLink(false);
      return;
    }
    checkEvaluationLink();
  }, [applicant.id, canViewLinks]);

  const checkEvaluationLink = async () => {
    if (!canViewLinks) {
      setHasEvaluationLink(false);
      setCheckingLink(false);
      return;
    }

    try {
      setCheckingLink(true);
      const response = await fetch(`/api/v1/applicants/${applicant.id}/evaluation-link`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await readJsonObject(response);
        setHasEvaluationLink(Boolean(getJsonString(data, 'url') && getJsonString(data, 'expiresAt')));
      } else {
        setHasEvaluationLink(false);
      }
    } catch {
      setHasEvaluationLink(false);
    } finally {
      setCheckingLink(false);
    }
  };

  const tabCount = hasEvaluationLink ? 3 : 2;
  const gridCols = tabCount === 3 ? 'grid-cols-3' : 'grid-cols-2';
  const getTabClassName = (isActive: boolean) => cn(
    getUnderlineNavTriggerClassName(isActive),
    reviewMode
      ? 'justify-center px-3 py-4 text-sm font-medium flex-shrink-0 md:flex-1'
      : 'justify-center px-3 py-4 text-xs flex-shrink-0 md:flex-1',
  );

  return (
    <div className="h-full flex flex-col min-h-0 pointer-events-auto">
      {/* Tab Navigation */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent md:overflow-x-visible md:pb-0 md:mx-0 md:px-0" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
        <div className={`flex w-full min-w-max md:min-w-0 md:grid md:w-full ${gridCols} bg-background border-b border-border flex-shrink-0`}>
          <div
            className={getTabClassName(activeTab === 'hiring')}
            onClick={() => setActiveTab('hiring')}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}
          >
            <BriefcaseIcon className="w-4 h-4" />
            Hiring
          </div>
          <div
            className={getTabClassName(activeTab === 'comments')}
            onClick={() => setActiveTab('comments')}
           role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}>
            <MessageSquare className="w-4 h-4" />
            {reviewMode ? 'Activity' : 'Comments & Activity'}
            {(() => {
              const commentCount = comments.length;
              return commentCount > 0 ? ` (${commentCount})` : '';
            })()}
          </div>
          {hasEvaluationLink && (
            <div
              className={getTabClassName(activeTab === 'evaluate')}
              onClick={() => setActiveTab('evaluate')}
             role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}>
              <FileCheck className="w-4 h-4" />
              Evaluate
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden pointer-events-auto">
        {activeTab === 'hiring' && (
          <div className="h-full overflow-y-auto">
            <ApplicantHiringBrief applicant={applicant} resumes={resumes} />
          </div>
        )}

        {activeTab === 'comments' && (
          <ApplicantCommentsSection
            applicantId={applicant.id}
            comments={comments}
            isEditing={isEditing}
            onCommentsChange={onRefresh}
          />
        )}

        {activeTab === 'evaluate' && hasEvaluationLink && (
          <EvaluateReportSection
            applicantId={applicant.id}
            isEmbedded={true}
          />
        )}
      </div>
    </div>
  );
};
