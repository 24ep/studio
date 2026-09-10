import type React from "react";
import type { BrandingTabProps } from "./BrandingTabTypes";
import { HeaderBrandingSection } from "./BrandingHeaderSection";
import { BrandingLoginBackgroundSection } from "./BrandingLoginBackgroundSection";
import { LogoManagementSection } from "./BrandingLogoManagementSection";
import { SplashScreenSection } from "./BrandingSplashSection";
import { SystemPreferenceSection } from "./SystemPreferenceRows";

export function BrandingContentCard(props: BrandingTabProps) {
    return (
        <div className="space-y-4">
            <BrandingPanel>
                <SystemPreferenceSection
                    title="Logo Management"
                    description="Configure company logos for each place they appear."
                >
                    <LogoManagementSection {...props} />
                </SystemPreferenceSection>
            </BrandingPanel>
            <BrandingPanel><BrandingLoginBackgroundSection {...props} /></BrandingPanel>
            <BrandingPanel><HeaderBrandingSection {...props} /></BrandingPanel>
            <BrandingPanel><SplashScreenSection {...props} /></BrandingPanel>
        </div>
    );
}

function BrandingPanel({ children }: { children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-[6px] border border-[#dfe2e8] bg-white px-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:px-6">
            {children}
        </div>
    );
}
