import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionNotice } from "@/components/session-notice";

import "./globals.css";

export const metadata: Metadata = {
  title: "reHEARse",
  description: "Listening practice with notes, discussion and guided replay.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <SessionNotice />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
