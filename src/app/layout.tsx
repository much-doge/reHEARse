import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionNotice } from "@/components/session-notice";

import "./globals.css";
import "./marketing.css";

export const metadata: Metadata = {
  title: "reHEARse",
  description: "A focused TOEFL ITP and ProTEFL preparation platform.",
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
