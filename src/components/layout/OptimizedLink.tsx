"use client";

import * as React from "react";
import Link from "next/link";

interface OptimizedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export const OptimizedLink = React.memo(function OptimizedLink({
  href,
  children,
  ...props
}: OptimizedLinkProps) {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
});
