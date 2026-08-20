import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YUK.WTF | Feed me trash",
  description: "A trash monster that eats your garbage and tells you what it is, where it goes, and why it is gross.",
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
