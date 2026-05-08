"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

interface PublicChromeProps {
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function PublicChrome({ children, footer }: PublicChromeProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main>{children}</main>
      {footer}
    </>
  );
}
