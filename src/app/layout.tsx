import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
