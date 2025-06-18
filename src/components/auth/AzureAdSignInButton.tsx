
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react"; // Or a specific Azure/Microsoft icon if you add one

// A simple Azure logo SVG as a component
const AzureLogo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <path d="M11.1429 0.904762L5.2381 4.71429V4.72381L0 8.38095L5.13333 11.7619L8.06667 14.3333L11.0476 11.8095V19.0952L20 11.581L11.1429 0.904762Z" fill="#0078D4"/>
  </svg>
);


export function AzureAdSignInButton() {
  return (
    <Button
      onClick={() => signIn("azure-ad", { callbackUrl: "/" })} // Redirect to dashboard after sign-in
      className="w-full btn-primary-gradient" // Rely on btn-primary-gradient for background and text color
      size="lg"
    >
      <AzureLogo />
      Sign in with Microsoft Azure AD
    </Button>
  );
}

