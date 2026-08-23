import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./platform.css";

export const metadata: Metadata = {
  title: "YUK.WTF | Waste intelligence that remembers",
  description: "Feed trash to YUK, map litter as evidence, track persistent waste sites, and keep cleanup history instead of disposable reports.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#d9ff55",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
