import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yuk.wtf"),
  title: "YUK — See waste. Map it. Fix it.",
  description:
    "YUK is rebuilding the waste-mapping lineage behind World Cleanup Day as an open, continuously updated model of waste in the physical world.",
  openGraph: {
    title: "YUK — See waste. Map it. Fix it.",
    description:
      "A new chapter in an old waste-mapping lineage. People provide evidence; AI helps structure, connect and act on it.",
    url: "https://yuk.wtf",
    siteName: "YUK",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "YUK — See waste. Map it. Fix it.",
    description:
      "A new chapter in an old waste-mapping lineage. People provide evidence; AI helps structure, connect and act on it."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
