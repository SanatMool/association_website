"use client";

import { usePathname } from "next/navigation";

interface PublicChromeProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}

export default function PublicChrome({ children, navbar, footer }: PublicChromeProps) {
  const pathname = usePathname();
  const isAdmin    = pathname?.startsWith("/admin");
  const isPlatform = pathname?.startsWith("/platform");
  const isPortal   = pathname?.startsWith("/portal");

  if (isAdmin || isPlatform || isPortal) return <>{children}</>;

  return (
    <>
      {navbar}
      <main>{children}</main>
      {footer}
    </>
  );
}
