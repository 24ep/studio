import Image from "next/image";
import type { CSSProperties } from "react";

export interface MobileSignInHeaderProps {
    appName: string;
    headerStyle: CSSProperties;
    secureLogoUrl: string | null;
}

export function MobileSignInHeader({
    appName,
    headerStyle,
    secureLogoUrl,
}: MobileSignInHeaderProps) {
    return (
        <div
            className="h-[40vh] flex flex-col items-start justify-end px-2 pb-20 relative flex-shrink-0 w-full login-transition"
            style={headerStyle}
        >
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0  h-full bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.2),transparent)]" />
            </div>

            <div className="flex flex-row items-center text-left gap-1 z-10">
                {secureLogoUrl ? (
                    <div className="relative h-[64px] w-[100px] drop-shadow-xl">
                        <Image
                            src={secureLogoUrl}
                            alt="App Logo"
                            fill
                            unoptimized
                            sizes="140px"
                            className="rounded-lg object-contain"
                            priority
                        />
                    </div>
                ) : (
                    <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center shadow-lg" style={{ width: '64px', height: '64px' }}>
                        <span className="text-xl font-bold text-white">CT</span>
                    </div>
                )}

                <div className="space-y-0.5">
                    <div className="text-[10px] uppercase tracking-[0.2em] opacity-70 font-black" style={{ color: 'inherit' }}>Welcome to</div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{ color: 'inherit' }}>
                        {appName}
                    </h1>
                </div>
            </div>
        </div>
    );
}
