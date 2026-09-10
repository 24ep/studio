import type { LoginPageLayoutType } from '@/lib/types';
import {
  DesktopSignInAuthCard,
  DesktopSignInHero,
  DesktopSignInMobileBrand,
} from './DesktopSignInViewParts';
import { buildDesktopSignInSecureLogoUrl } from './desktop-signin-view-utils';
import type { SignInHeroCopy } from './signin-appkit-copy';

export interface DesktopSignInViewProps {
  loginPageStyle: React.CSSProperties;
  appName: string;
  appLogoUrl: string | null;
  showLogoOnly: boolean;
  isClient: boolean;
  isThemeDark: boolean;
  contextualLogos: {
    loginPageLogoLightMode?: string | null;
    loginPageLogoDarkMode?: string | null;
  };
  errorMessage: string;
  basicAuthEnabled: boolean;
  isAzureAdConfigured: boolean;
  activeFontColor: string;
  activeBgStart: string;
  activeBgEnd: string;
  loginPageFooter: string;
  loginHeroCopy: SignInHeroCopy;
  organizationName: string;
  loginLayoutType: LoginPageLayoutType;
  loginStage: 'email' | 'otp';
  onStageChange: (stage: 'email' | 'otp') => void;
}

export function DesktopSignInView(props: DesktopSignInViewProps) {
  const {
    appLogoUrl,
    contextualLogos,
    isThemeDark,
    loginPageStyle,
  } = props;
  const secureLogoUrl = buildDesktopSignInSecureLogoUrl({ appLogoUrl, contextualLogos, isThemeDark });

  return (
    <div
      className="relative min-h-[100dvh] h-[100dvh] w-full overflow-hidden"
      style={{
        ...loginPageStyle,
        fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
      }}
    >
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(110deg,rgba(248,250,252,0.06),rgba(15,23,42,0.08))]" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.18),transparent_32%)]" />

      <div className="relative z-10 flex h-full w-full flex-col md:flex-row">
        <DesktopSignInHero {...props} secureLogoUrl={secureLogoUrl} />

        <div className="flex w-full items-center justify-center px-4 py-6 md:w-[46%] md:min-w-[420px] md:justify-end md:pl-6 md:pr-3 lg:pl-8 lg:pr-4">
          <div className="w-full max-w-[580px]">
            <DesktopSignInMobileBrand {...props} secureLogoUrl={secureLogoUrl} />
            <DesktopSignInAuthCard {...props} secureLogoUrl={secureLogoUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
