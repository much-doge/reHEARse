import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Listening Foundation Lab",
  description: "Listen, notice, relisten — without a score.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
