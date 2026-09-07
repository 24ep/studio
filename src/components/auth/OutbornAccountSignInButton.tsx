"use client";

import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";

export function OutbornAccountSignInButton() {
  const handleSignIn = async () => {
    try {
      const result = await signIn("outborn-account", {
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        console.error('[OUTBORN ACCOUNT BUTTON] Sign-in error:', result.error);
        window.location.href = `/auth/signin?error=${encodeURIComponent(result.error)}`;
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('[OUTBORN ACCOUNT BUTTON] Unexpected sign-in error:', error);
      window.location.href = '/auth/signin?error=OutbornAccount';
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      variant="secondary"
      className="h-10 w-full rounded-xl border border-border/20 text-sm font-medium shadow-sm transition-all hover:bg-secondary/80 active:scale-[0.98]"
    >
      <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
      Continue with Outborn Account
    </Button>
  );
}
