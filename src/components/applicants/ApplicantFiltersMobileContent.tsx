import { ApplicantFilterTabs } from './ApplicantFilterTabs';
import { ApplicantFiltersMobileAdvancedPanel } from './ApplicantFiltersMobileAdvancedPanel';
import { ApplicantFiltersMobileStandardPanel } from './ApplicantFiltersMobileStandardPanel';
import type { ApplicantFiltersMobileContentProps } from './ApplicantFiltersMobileContentTypes';

export function ApplicantFiltersMobileContent(props: ApplicantFiltersMobileContentProps) {
  const { activeTab, className, onTabChange } = props;

  return (
    <div className={['space-y-0 Applicant-filters', className].filter(Boolean).join(' ')}>
      <div className="bg-card overflow-hidden border-t border-border/50">
        <div>
          <ApplicantFilterTabs activeTab={activeTab} onTabChange={onTabChange} />
          <ApplicantFiltersMobileStandardPanel {...props} />
          <ApplicantFiltersMobileAdvancedPanel {...props} />
        </div>
      </div>
    </div>
  );
}
