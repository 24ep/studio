import { PositionDetailDrawerActivePanel } from './PositionDetailDrawerContentParts';
import { PositionDetailTabsNav } from './PositionDetailTabsNav';
import type { PositionDetailDrawerContentProps } from './PositionDetailDrawerContentTypes';

export function PositionDetailDrawerContent(props: PositionDetailDrawerContentProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <PositionDetailTabsNav
            activeTab={props.activeTab}
            applicantsCount={props.isJobMatchEnabled ? props.allApplicantsTotal : props.appliedApplicantsTotal}
            headcountsTotal={props.headcountsTotal}
            onTabChange={props.onTabChange}
          />

          <div className="flex-1 overflow-hidden flex flex-col min-w-0">
            <PositionDetailDrawerActivePanel {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}
